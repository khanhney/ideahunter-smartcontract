
var request = require('request');

var Gearman = require('node-gearman');
var gearman = new Gearman('localhost', 4730);
var mongoose = require('mongoose')
const WalletModel = require('../models/Wallet');
const Transaction = require('../models/Transactions');
const IPFSTemporary = require('../models/HashIPFSTemp');
const IPFS = require('ipfs-mini');
const ipfs = new IPFS({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});

const TOKEN = `346494199ea34772803b65539b850ff2`;
gearman.registerWorker('CREATE_WALLET_PATIENT', async (payload, worker) => {
    if(!payload){
        worker.error();
        return;
    };
    const _idUser = JSON.parse(payload).userID;
    request(
        { method: 'POST'
        , uri: `https://api.blockcypher.com/v1/eth/main/addrs?token=${TOKEN}`}
        ,   async (error, response, body) => {
                const data = JSON.parse(body);
                console.log({ _idUser, data })
                /**
                 * INSERT
                 */
                const newWallet = new WalletModel({
                    userID: _idUser,
                    publicKey: data.public,
                    privateKey: data.private,
                    addressWallet: data.address
                });
                newWallet.save()    
                    .then(result => {
                        console.log({ result });
                        worker.end();
                    })
                    .catch(err => {
                        console.log({ err });
                        worker.end();
                    })
            }
        )
});

gearman.registerWorker('SUBMIT_IPFS', async (payload, worker) => {
    if(!payload){
        worker.error();
        return;
    };
    const _idUser = JSON.parse(payload).userID;
    const infoTransaction = await Transaction.findOne({patientID: _idUser})
                                .populate('patientID')
                                .populate('doctorID')
                                .populate('prescriptionID');
    console.log({ infoTransaction })
//    const randomData = '8803cf48b8805198dbf85b2e0d514320_khanhney'; // random bytes for testing
    ipfs.add(JSON.stringify(infoTransaction), async (err, hash) => {
        if (err) {
            return console.log(err);
        }
        console.log('HASH:=', hash);

        const newIPFSTemporary = new IPFSTemporary({
            userID: _idUser,
            ipfsHash: hash
        });
        const saveIPFSString = await newIPFSTemporary.save();
        console.log({ saveIPFSString })
        worker.end();
    });
});