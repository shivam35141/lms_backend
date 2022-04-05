const mongoose = require('mongoose');

const shopSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
    },
    shopNo:{
        type:Number,
        required:true
    },
    bannerImages: [{
        type: String
    }]
})


shopSchema.method('toJSON', function(){
    const { __v, ...object } = this.toObject();
    const { _id:id, ...result } = object;
    return { ...result, id };
});

exports.Shop = mongoose.model('Shop', shopSchema);
