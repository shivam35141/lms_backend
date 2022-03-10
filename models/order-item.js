const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
    quantity: {
        type: Number,
        required: true
    },
    shopNo: {
        type:Number,
        // required:true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    price:{
        type:String
    }
})

exports.OrderItem = mongoose.model('OrderItem', orderItemSchema);

