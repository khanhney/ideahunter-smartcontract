const solc = require('solc');
const fs = require('fs');
const Web3 = require('web3');
const path = require('path');

var contractName = 'SPIDER';

module.exports = (urlProvider = 'http://localhost:8545') => {
    const web3 = new Web3(new Web3.providers.HttpProvider(urlProvider));

    let getABIandByteCodefromContract = (contractName, cb) => {
        let abiDefinition = null, byteCode = null;
        let file_link = path.join(__dirname, '../../contracts/spider.sol');
        return fs.readFile(file_link, (err, file) => {
            if (err) {
                return cb(err);
            } else {
                let compiledCode = solc.compile(file.toString());
                try {
                    abiDefinition = JSON.parse(compiledCode.contracts[`:${contractName}`].interface);
                    byteCode = compiledCode.contracts[`:${contractName}`].bytecode;
                    return cb(null, {
                        abiDefinition,
                        byteCode
                    });
                } catch (e) {
                    return cb(new Error('Unable to parse and compile contract code !'));
                }
            }
        });
    };

    let getContractInstance = (contractName, contractAddress, cb) => {
        return getABIandByteCodefromContract(contractName, (err, contractMetadata) => {
            if (err) {
                return cb(err);
            } else {
                let abi = contractMetadata.abiDefinition;
                const contract = web3.eth.contract(abi);
                const instance = contract.at(contractAddress);
                return cb(null, instance);
            }
        });
    };

    let deployNewContract = (accountAddress = web3.eth.accounts[0], contractName, params, cb) => {
        getABIandByteCodefromContract(contractName, (err, metadata) => {
            if (err) {
                return cb(new Error(err));
            } else {

                let web3Contract = web3.eth.contract(metadata.abiDefinition);
                let deployedContract = web3Contract.new(params, { data: metadata.byteCode, from: accountAddress, gas: 4700000 });
                let receipt = web3.eth.getTransactionReceipt(deployedContract.transactionHash);

                if (receipt && receipt.contractAddress) {
                    return cb(null, {
                        transactionHash: receipt.transactionHash,
                        contractAddress: receipt.contractAddress
                    });
                } else {
                    return cb(new Error("Deploy ok but contract Address = null"));
                }
            }
        });
    };

    /**idAddress, name, phone, role, hashString */
    /** 
     *  ipfsHash
    */
    // let PUSH_IPFS = (ipfsHash, from, to, method, cb) => {
    //     getContractInstance('SPIDER', to, (err, instance) => {
    //         var Tx = require('ethereumjs-tx');
    //         var privateKey = new Buffer(from.private, 'hex')

    //         var rawTx = {
    //             nonce: web3.toHex(web3.eth.getTransactionCount(from.address, 'pending')),
    //             gasPrice: web3.toHex(web3.toHex(require('config').get('contract.gasPriceDefault'))),
    //             gasLimit: web3.toHex(web3.toHex(require('config').get('contract.gasLimitDefault'))),
    //             to: to,
    //             value: '0x0',
    //             data: instance[method].getData(ipfsHash)
    //         };

    //         var tx = new Tx(rawTx);
    //         tx.sign(privateKey);

    //         var serializedTx = tx.serialize();

    //         web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function (err, hash) {
    //             return cb(err, hash);
    //         });
    //     });
    // };
    let addIPFSHash = (ipfsHash, from, to, method, cb) => {
        getContractInstance('SPIDER', to, (err, instance) => {
            var Tx = require('ethereumjs-tx');
            var privateKey = new Buffer(from.private, 'hex')

            var rawTx = {
                nonce: web3.toHex(web3.eth.getTransactionCount(from.address, 'pending')),
                gasPrice: web3.toHex(web3.toHex(require('config').get('contract.gasPriceDefault'))),
                gasLimit: web3.toHex(web3.toHex(require('config').get('contract.gasLimitDefault'))),
                to: to,
                value: '0x0',
                data: instance[method].getData(ipfsHash)
            };

            var tx = new Tx(rawTx);
            tx.sign(privateKey);

            var serializedTx = tx.serialize();


            web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function (err, hash) {
                return cb(err, hash);
            });
        });
    };

    return {
        addIPFSHash,
        getContractInstance,
        getABIandByteCodefromContract,
        deployNewContract,
    }
}
