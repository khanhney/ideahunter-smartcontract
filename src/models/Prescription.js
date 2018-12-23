// đơn thuốc
const mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

const PrescriptionSchema = mongoose.Schema({
    // ten don thuoc
    title: String,
    // So Lan Uong
    amount: Number,
    description: String,
    createAt: {
        type: Date,
        default: Date.now
    },
    medicine : { 
        type: Schema.Types.ObjectId,
        ref : 'medicine'
    },
    patientID : {
        type: Schema.Types.ObjectId,
        ref: 'user'
    }
    // doctorID       : {
    //     type : Schema.Types.ObjectId,
    //     ref  : 'doctor'
    // },
});
const Prescription = mongoose.model('prescription', PrescriptionSchema);
module.exports = Prescription;