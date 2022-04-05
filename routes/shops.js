const {Shop} = require('../models/shop');
const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) =>{
    let filter = {};
    if(req.query.shopNo){
        filter = {shopNo:req.query.shopNo};
    }
    const shopDetails = await Shop.find(filter);
    if(!shopDetails) {
        res.status(500).json({success: false})
    } 
    res.status(200).send(shopDetails);
})

router.get('/:id', async(req,res)=>{
    const shop = await Shop.findById(req.params.id);

    if(!shop) {
        res.status(500).json({message: 'The shop with the given ID was not found.'})
    } 
    res.status(200).send(shop);
})



router.post('/', async (req,res)=>{
    let shop = new Shop({
        name: req.body.name,
        icon: req.body.icon,
        bannerImages: req.body.bannerImages,
        shopNo:req.body.shopNo
    })
    shop = await shop.save();

    if(!shop)
    return res.status(400).send('the shop cannot be created!')

    res.send(shop);
})


module.exports =router;