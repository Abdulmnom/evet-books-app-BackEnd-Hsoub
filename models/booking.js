const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const bookingSchema = new Schema({
    event: {
        type: Schema.Types.ObjectId,
        // ref: 'Event',  يشير الى أن هذا الحقل هو مرجع إلى نموذج آخر "Event"
        ref: 'Event',
        
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
       
    }
    // timestamps: true // هذا الخيار يضيف حقول createdAt و updatedAt تلقائيًا للمعلومات الزمنية
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema); 