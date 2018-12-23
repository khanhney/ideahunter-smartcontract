const express = require('express');
const route = express.Router();
const bodyParser = require('body-parser');
const { hash, compare } = require('bcrypt');
const moment = require('moment');
var Gearman = require('node-gearman');
var gearman = new Gearman('localhost', 4730);
const IPFS = require('ipfs-mini');
const ipfs = new IPFS({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});

/**
 * IMPORT INTERNAL
 */
route.use(bodyParser.urlencoded({extended: false}));
route.use(bodyParser.json());

require('../../workers');

const User = require('../../models/User');
const Prescription = require('../../models/Prescription');
const Transaction = require('../../models/Transactions');
const Doctor = require('../../models/Doctor');

route.get('/sign-up', (req, res) => {
    res.render('register');
});

route.post('/register-patient', async (req, res) =>{
    const { username, password, address, phone, birthday, fullname,
        age, weight, height, acitve
    } = req.body;

    try {
        const checkExist = await User.findOne({ username });
        if (checkExist) return res.json({
            error: true,
            message: 'user_exist'
        });

        const hashPassword = await hash(password, 8);

        const userNew = new User({ 
            username, password: hashPassword, address, phone, birthday, fullname,
            age, weight, height, acitve
         });
        const userSave = await userNew.save();
        if (!userSave) return res.json({
            error: true,
            message: 'cannot_insert_user'
        });
        gearman.submitJob('CREATE_WALLET_PATIENT', JSON.stringify({ userID: userSave._id }));
        gearman.submitJob('CREATE_WALLET_PATIENT', JSON.stringify({ userID: userSave._id }));
        return res.json({
            error: false,
            data: userSave
        });
    } catch (error) {
        return res.json({
            error: true,
            message: error.message
        });
    }
});

/**
 * Cập Nhật Tình trạng sức khỏe người dùng từ những ngày sau
 */
route.post('/update-active-of-patient/:userID', async(req, res) => {
    const { userID } = req.params;
    const { weight, height, acitve } = req.body;
    try {
        let updateInfoUser = await User.findByIdAndUpdate(userID, {
            weight, height, acitve
        });
        if (!updateInfoUser) return res.json({
            error: true,
            message: 'cannot_update_info_user'
        });
        return res.json({
            error: false,
            data: updateInfoUser
        })
    } catch (error) {
        return res.json({
            error: true,
            message: error.message
        })
    }
})

route.get('/login', (req, res) => {
    res.render('login');
});

route.post('/login', async(req, res) => {
    const { username_or_phone, password } = req.body;
    const checkExist = await User.findOne({
        $or: [
            { username: username_or_phone },
            { phone   : username_or_phone }
        ]
    });
    if (!checkExist) return res.json({
        error: true,
        message: 'user_not_exist'
    });

    if (!compare(password, checkExist.password))
        return res.json({
            error: true,
            message: 'password_invalid'
        });
    return res.json({
        error: false,
        data: checkExist
    });
});

route.get('/danh-sach-ho-so', async(req, res) => {
    try {
        const listRecord = await User.find({});
        return res.render('list-patiant', { listPatiant: listRecord, moment });
    } catch (error) {
        return res.json({
            error: true,
            message: error.message
        });
    }
})

// register doctor
route.post('/them-bac-si', async (req, res) => {
    try {
        const { fullname, gender, birthday, phone } = req.body;
        const doctorNew = new Doctor({ fullname, gender, birthday, phone });
        const doctorSave = await doctorNew.save();
        if (!doctorSave) return res.json({
            error: true,
            message: 'cannot_insert_doctor'
        });
        return res.json({
            error: false,
            data: doctorSave
        });
    } catch (error) {
        res.json({
            error: true,
            message: error.message
        });
    }
})

// route.post('/cap-nhat-giao-dich', async(req, res) => {
//     const { patientID, totalPrice, description, patientID } = req.body;
// })

route.get('/danh-sach-bac-si', async (req, res)=> {
    try {
        const listDoctor = await Doctor.find({});
        return res.json({
            error: false,
            data: listDoctor
        });
    } catch (error) {
        return res.json({
            error: true,
            message: error.message
        });
    }
})

route.get('/danh-sach-bac-si-truc-thuoc', async(req, res) => {
    const listDoctor = await Doctor.find({});
    res.render('list-doctor', { listDoctor, moment });
})

route.post('/cap-nhat-ho-so-giao-dich', async(req, res) =>{
    const { patientID, doctorID, totalPrice, description } = req.body;
    try {
        const infoPrescription = await Prescription.find({
            patientID: patientID
        });
        const prescriptionID = infoPrescription[0]._id;
        const newTransaction = new Transaction({
            patientID, doctorID: doctorID, prescriptionID, totalPrice, description
        });
        const savePrescription = await newTransaction.save();
        if (!savePrescription) return res.json({
            error: true,
            message: 'cannot_save_prescription'
        });
        // gearman.submitJob('SUBMIT_IPFS', JSON.stringify({ userID: patientID }));
        return res.json({
            error: false,
            data: savePrescription
        });
    } catch (error) {
        return res.json({
            error: true,
            message: error.message
        })
    }

})
module.exports = route;