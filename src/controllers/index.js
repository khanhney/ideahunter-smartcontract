
const express = require('express');
const route = express.Router();
const bodyParser = require('body-parser');
const { hash, compare } = require('bcrypt');
const moment = require('moment');

const IPFS = require('ipfs-mini');
const ipfs = new IPFS({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});
const HashIPFS = require('../models/HashIPFSTemp');

const User = require('../models/User');
var QRCode = require('qrcode');
var Gearman = require('node-gearman');
var gearman = new Gearman('localhost', 4730);
var formatCurrency = require('number-format.js');
const _ = require('lodash');

const RATING_HASHING = require('../models/RatingSmartContract');
/**
 * IMPORT INTERNAL
 */
route.use(bodyParser.urlencoded({extended: false}));
route.use(bodyParser.json());

const contractService = require('../helps/index.js')(require('config').get('provider'));
const DATA_DEFAULT = require('../../config/default.json');

const Transaction = require('../models/Transactions');
// route.get('/xac-nhan-ipfs/:userID', async (req, res) => {
//     const { userID } = req.params;
//     const infoTransactionUser = await HashIPFS.find({
//         userID: userID
//     }).sort({ createAt: -1 });
//     const infoUserLatest = infoTransactionUser[0];
//     console.log({ infoUserLatest })
//     contractService.addIPFSHash(infoUserLatest.ipfsHash, {
//         address: DATA_DEFAULT.contract.owner.address,
//         private: DATA_DEFAULT.contract.owner.private
//     }, DATA_DEFAULT.contract.address, 'setHash', function (err, hash) {
//         // if (err) {
//         //     return res.status(500).json({ "error": err });
//         // } else {
//         //     return res.status(200).json(hash);
//         // }
//         console.log('________________');
//         console.log(err, hash);
//     });
//     // const randomData = '8803cf48b8805198dbf85b2e0d514320_khanhney'; // random bytes for testing
//     // ipfs.add(randomData, (err, hash) => {
//     // if (err) {
//     // return console.log(err);
//     // }
    
//     // console.log('HASH:=', hash);
//     // });
// })

route.get('/xac-nhan-ipfs/:userID',async(req, res) => {
    const { userID } = req.params;
    console.log({ userID })
    // const host = 'https://c596c8c7.ngrok.io';
    // const linkVerify = `${host}/verify-qrcode-user/${userID}`;
    const qrCodeGenerate = await QRCode.toDataURL(userID);
    if (!qrCodeGenerate) return res.json({
        error: true,
        message: 'cannot_generate_qrcode'
    });
    console.log({ qrCodeGenerate })
    gearman.submitJob('SUBMIT_IPFS', JSON.stringify({ userID: userID }));
    return res.json({
        error: false,
        data: qrCodeGenerate
    });
})

// route.get('/generate-qr-code/:userID', async(req, res) => {
//     const { userID } = req.params;
//     const host = 'https://49362189.ngrok.io';
//     const linkVerify = `${host}/verify-qrcode-user/${userID}`;
//     const qrCodeGenerate = await QRCode.toDataURL(linkVerify);
//     if (!qrCodeGenerate) return res.json({
//         error: true,
//         message: 'cannot_generate_qrcode'
//     });
//     return res.json({
//         error: false,
//         data: qrCodeGenerate
//     });
// })

route.get('/verify-qrcode-user/:userID', async(req, res) => {
    console.log('++++++++++++++++++++++++++++');
    const { userID } = req.params;
    const transactions = await Transaction.find({
        patientID: userID
    }).sort({ createAt: -1 })
    .populate('patientID')
    .populate('doctorID')
    .populate('prescriptionID');

    if (!transactions) return res.json({
        error: true,
        message: 'cannot_get_info_transaction'
    });
    // console.log({
    //     transactions: transactions[0]
    // })
    return res.json({
        error: false,
        data: transactions[0]
    });
})

route.get('/submit-verify-info/:userID', async(req, res) => {
    const { userID } = req.params;
    const infoTransactionUser = await HashIPFS.find({
        userID: userID
    }).sort({ createAt: -1 });
    console.log({ infoTransactionUser })
    const infoUserLatest = infoTransactionUser[0];
    /**
     * PUSH BLOCKCHAIN
     */
    contractService.addIPFSHash(infoUserLatest.ipfsHash, {
        address: DATA_DEFAULT.contract.owner.address,
        private: DATA_DEFAULT.contract.owner.private
    }, DATA_DEFAULT.contract.address, 'setHash', async (err, hash) => {
        if (err) {
            return res.json({
                error: true,
                message: err.message
            })
        } else {
            
            /** CAP NHAT STATUS USER - DA LUU TRU TREN BLOCKCHAIN (status) */
            // 0: out hospital
            let updateStatus = await User.findByIdAndUpdate(userID, {
                status: 0
            });

            return res.json({
                error: false,
                message: 'push_blockchain_success',
                data: {
                    hash
                }
            })
        }
    });
})

/**
 * Cannot apply for each USER
 */
/**GET DATA IPI || txHash -> ipfsHashString -> ObjData */
route.get('/get-transactions', async(req, res) => {
    const { txHash } = req.params;

    contractService.getContractInstance(DATA_DEFAULT.contract.name, DATA_DEFAULT.contract.address, async (err, instance) => {
        if (err) {
            return res.status(500).json({ 
                error: true,
                message: err.message
            });
        } else {
            var result = await instance.getHash();
            ipfs.catJSON(result, (err, resultIPFS) => {
                if (err) return res.json({
                    error: true,
                    message: 'cannot_get_data_ipfs'
                });
                return res.json({
                    error: false,
                    data: resultIPFS
                })
            });
        }
    });
});

route.get('/bao-cao-thong-ke', async(req, res) => {
    // try {
        const { gender, weight, height, starttime, endtime, active, age } = req.query;
        if (gender && active) {
            if (Number.isNaN(Number(gender)) || Number.isNaN(Number(active)))
            res.redirect('/bao-cao-thong-ke');
        }
         /**
         * ĐIỀU KIỆN CHO USER
         */
        
        let conditionUser = {};
        if (weight) {
            let arrSplitWeight = weight.split(';');
            let fromWeight = arrSplitWeight[0];
            let toWeight = arrSplitWeight[1];
            conditionUser.weight = {
                $gte: Number(fromWeight),
                $lte: Number(toWeight)
            };
        }
        if (height) {
            let arrSplitHeight = height.split(';');
            let fromHeight = arrSplitHeight[0];
            let toHeight = arrSplitHeight[1];
            conditionUser.height = {
                $gte: Number(fromHeight),
                $lte: Number(toHeight)
            };
        }
        if (age) {
            let arrSplitAge = age.split(';');
            let fromAge = arrSplitAge[0];
            let toAge = arrSplitAge[1];
            conditionUser.age = {
                $gte: Number(fromAge),
                $lte: Number(toAge)
            };
        }
        if (gender) {
            conditionUser.gender = Number(gender);
        }
        if (active) {
            conditionUser.active = Number(active);
        }
        
        /**
         * ĐIỀU KIỆN CHO TRANSACTION
         */
        let conditionReport = {
            patientID: { $ne: null }
        };
        if (starttime && endtime) {
            conditionReport.createAt = {
                $gte: starttime,
                $lte: endtime
            }
        }
        // let filterNullAfterPopulate
        let listTransactionsTemp = await Transaction.find(conditionReport)
            .populate({ 
                path: 'patientID',
                match: conditionUser,
            })
            .populate('prescriptionID')
        let listTransactions = _.filter(listTransactionsTemp, transaction => transaction.patientID);

        if(!listTransactionsTemp) return res.json({
            error: true,
            message: 'cannot_get_list_transactions'
        });
        res.render('reports', { listTransactions, moment, formatCurrency, query: {
            gender, weight, height, starttime, endtime, active, age
        } })
    // } catch (error) {
    //     return res.json({
    //         error: true,
    //         message: error.message
    //     })
    // }
    // res.render('reports');
});

route.get('/tra-cuu-kiem-tra-ho-so-blockchain', async(req, res) => {
    const listPatient = await User.find({
        status: 0
    });
    res.render('search-with-blockchain', { listPatient, moment });
});

/*********RATING_ K_TRAVEL_____ */
route.post('/add-rating-blockchain', async (req, res) => {
    const { hashString } = req.body;
    console.log({ hashString });
    let initRatingHashing = new RATING_HASHING({ hashString: hashString });
    let saveRatingHashing = await initRatingHashing.save();
    if (!saveRatingHashing) return res.json({ error: true, message: 'cannot_save_rating_hashing' });

    contractService.addIPFSHash(saveRatingHashing.hashString, {
        address: DATA_DEFAULT.contract.owner.address,
        private: DATA_DEFAULT.contract.owner.private
    }, DATA_DEFAULT.contract.address, 'setHash', async (err, hash) => {
        if (err) {
            return res.json({
                error: true,
                message: err.message
            })
        } else {
            /** CAP NHAT STATUS RATING - DA LUU TRU TREN BLOCKCHAIN (status) */
            let updateStatus = await RATING_HASHING.findByIdAndUpdate(saveRatingHashing._id, {
                status: 1
            }, { new: true })

            return res.json({
                error: false,
                message: 'push_blockchain_success',
                data: {
                    hash, updateStatus
                }
            })
        }
    });
});

module.exports = route; 