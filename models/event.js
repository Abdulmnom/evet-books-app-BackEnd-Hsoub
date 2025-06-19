const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema( {
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
        // timestamps: true // هذا الخيار يضيف حقول createdAt و updatedAt تلقائيًا للمعلومات الزمنية
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
