// phiếu xét nghiệm
const mongoose = require('mongoose');
const schema = mongoose.Schema;

const QrSchema = mongoose.Schema({
    idUser: {
        type: schema.Types.ObjectId,
        ref: 'user'
    },
    qrcode : {
        type: String
    }
});
const QrUser = mongoose.model('qr_user', QrSchema);
module.exports = QrUser;