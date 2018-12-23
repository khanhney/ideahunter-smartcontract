// giao dich 1 lan cua benh nhan
const mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

const TransactionSchema = mongoose.Schema({
    patientID: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    doctorID : {
        type: Schema.Types.ObjectId,
        ref : 'doctor'
    },
    prescriptionID: {
        type: Schema.Types.ObjectId,
        ref : 'prescription'
    },
    createAt : { 
        type: Date,
        default: Date.now
    },
    totalPrice: {
        type: Number
    },
    description: {
        type: String
    }
});
const Transaction = mongoose.model('transaction', TransactionSchema);
module.exports = Transaction;