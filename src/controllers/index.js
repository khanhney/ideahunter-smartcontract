
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
    const host = 'https://4b768f12.ngrok.io';
    const linkVerify = `${host}/verify-qrcode-user/${userID}`;
    const qrCodeGenerate = await QRCode.toDataURL(linkVerify);
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
    const infoUserLatest = infoTransactionUser[0];

    // const infoTransactionUser = await HashIPFS.find({
    //     userID: userID
    // }).sort({ createAt: -1 });
    // const infoUserLatest = infoTransactionUser[0];
    // res.json(infoUserLatest)

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
    try {
        let listTransactions = await Transaction.find({})
            .populate('patientID')
            .populate('prescriptionID');
            
        if(!listTransactions) return res.json({
            error: true,
            message: 'cannot_get_list_transactions'
        });
        res.render('reports', { listTransactions, moment, formatCurrency })
    } catch (error) {
        return res.json({
            error: true,
            message: error.message
        })
    }
    res.render('reports');
});

route.get('/tra-cuu-kiem-tra-ho-so-blockchain', async(req, res) => {
    const listPatient = await User.find({
        status: 0
    });
    res.render('search-with-blockchain', { listPatient, moment });
})

module.exports = route; 