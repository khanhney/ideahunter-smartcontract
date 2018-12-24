// phiếu xét nghiệm
const mongoose = require('mongoose');

const RatingHasingSchema = mongoose.Schema({
    // rating: { type: String },
    hashString: { type: String },
    /**
    * 0.NOT PUSH
    * 1. PUSHED BLOCKCHAIN
     */
    status: { status: Number, default: 0 },
    createAt: { type: Date, default: Date.now }
});
const RatingHasing = mongoose.model('rating_hasing', RatingHasingSchema);
module.exports = RatingHasing;