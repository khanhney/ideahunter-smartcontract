const express = require('express');
const route = express.Router();
const bodyParser = require('body-parser');
const { hash, compare } = require('bcrypt');
const moment = require('moment');
/**
 * IMPORT INTERNAL
 */
route.use(bodyParser.urlencoded({extended: false}));
route.use(bodyParser.json());

const Prescription = require('../../models/Prescription');
const Medicine = require('../../models/Medicine');
const Transaction = require('../../models/Transactions');

/**
 * MEDICINE
 */
route.post('/them-thuoc', async (req, res) => {
    try {
        const { name, price, origin } = req.body;
        const medicineNew = new Medicine({ name, price, origin });
        const medicineSave = await medicineNew.save();
        if (!medicineSave) return res.json({
            error: true,
            message: 'cannot_insert_midicine'
        });
        return res.json({
            error: false,
            data: medicineSave
        });
    } catch (error) {
        res.json({
            error: true,
            message: error.message
        });
    }
});

route.get('/danh-sach-thuoc', async(req, res) => {
    const listMedicines = await Medicine.find({});
    res.json({
        error: false,
        data: listMedicines
    });
})

route.get('/danh-sach-thuoc-phu-thuoc', async (req, res) => {
    const listMedicines = await Medicine.find({});
    res.render('list-medicines', { listMedicines });
})

route.post('/them-don-thuoc', async (req, res) => {
    try {
        const { title, amount, description, medicineID, patientID } = req.body;
        
        console.log({ title, amount, description, medicineID, patientID })
        
        const newPrescription = new Prescription({ title, amount, description, medicine: medicineID, patientID });
        const savePrescription = await newPrescription.save();
        if (!savePrescription) return res.json({
            error: true,
            message: 'cannot_insert_prescription'
        });

        return res.json({
            error: false,
            data: savePrescription
        })
    } catch (error) {
        return res.json({
            error: true,
            message: error.message
        })
    }
});

route.get('/thong-tin-don-thuoc/:userID', async(req, res) => {
    try {
        const { userID } = req.params;
        const infoRescriptionOnlyOnce = await Prescription.find({
            patientID: userID
        });
        res.json({
            error: false,
            data: infoRescriptionOnlyOnce[0]
        })
    } catch (error) {
        res.json({
            error: true,
            message: error.message
        })
    }
});

route.post('/them-lich-su-kham', async(req, res) => {
    try {
        const { description, totalPrice, prescriptionID, doctorID, patientID } = req.body;
        const newTransaction = new Transaction({ description, totalPrice, prescriptionID, doctorID, patientID });
        const saveTransaction = await newTransaction();
        if (!newTransaction) 
            return res.json({
                error: true,
                message: 'cannot_insert_new_transaction'
            });
        return res.json({
            error: false,
            data: saveTransaction
        });
    } catch (error) {
        return res.json({
            error: true,
            message: error.message
        })
    }
})
module.exports = route;