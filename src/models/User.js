const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var Schema = require('mongoose').Schema;

const userSchema = mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique: true
    },
    password: String,
    address : String,
    phone   : String,
    birthday: Date,
    fullname: String,
    // nhung don thuoc trong cac lan patient kham benh
    // lich su benh an
    listPatients: [
        { 
            type: Schema.Types.ObjectId,
            ref : 'patient'
        }
    ],
    /**
     * 1. in hopital
     * 0. out hopital
     */
    status: {
        type: Number,
        default: 1
    },
    wallet: {
        type: Schema.Types.ObjectId,
        ref : 'wallet'
    },
    createAt: {
        type: Date,
        default: Date.now
    },
    // danh sach cac ipfs hastring

    /**
     * UPDATE TRAINING AI
     */
    age    : {
        type: Number,
        default: 20
    },
    weight : {
        type: Number,
        default: 65
    },
    height : {
        type: Number,
        default: 172
    },
    /**
     * 1. NAME 0.NU
     */
    gender  : {
        type: Number,
        default: 1
    },
    /**
     * Các Loại Hoạt Động
     * 0. ÍT (Sometime)
     * 1. Vừa (usually)
     * 2. Thường Xuyên (Normal)
     * 3. Nhiều (Super)
     * 4. Rất Nhiều (Extra)
     */
    active  : {
        type: Number,
        default: 0
    }
});
const User = mongoose.model('user', userSchema);
module.exports = User;