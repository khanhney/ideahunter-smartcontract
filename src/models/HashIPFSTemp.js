// phiếu xét nghiệm
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const IPFSTemporarySchema = mongoose.Schema({
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    ipfsHash: String,
    txHashEth: String,
    createAt: {
        type: Date,
        default: Date.now
    }
});
const IPFSTemporary = mongoose.model('ipfs_temporary', IPFSTemporarySchema);
module.exports = IPFSTemporary;