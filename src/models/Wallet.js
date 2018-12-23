// vi dien luu tru
const mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

const walletSchema = mongoose.Schema({
    userID: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    publicKey:  String,
    privateKey: String,
    addressWallet: String
});
const Wallet = mongoose.model('wallet', walletSchema);
module.exports = Wallet;