// phiếu xét nghiệm
const mongoose = require('mongoose');

const DoctorSchema = mongoose.Schema({
    fullname: String,
    gender  : Number,
    birthday: Date,
    phone: String
});
const Doctor = mongoose.model('doctor', DoctorSchema);
module.exports = Doctor;