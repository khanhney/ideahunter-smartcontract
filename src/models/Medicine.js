// đơn thuốc
const mongoose = require('mongoose');

const MedicineSchema = mongoose.Schema({
   // ten thuoc
   name: String,
   // gia thuoc
   price: Number,
   //xuat xu
   origin: String,
   status: {
       type: Number,
       default: 1
   }
});
const Medicine = mongoose.model('medicine', MedicineSchema);
module.exports = Medicine;