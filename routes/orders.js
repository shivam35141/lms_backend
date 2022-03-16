const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const { Product } = require('../models/product');
const router = express.Router();

router.get(`/`, async (req, res) => {
    let filter = {};
    if (req.query.shopNo) {
        filter = { shopNo: req.query.shopNo };
    }
    const orderList = await Order.find(filter).populate('user', 'name').sort({'dateOrdered': -1}).populate('orderItems').populate([{
        path: 'orderItems',
        model: 'OrderItem',
        populate: {
          path: 'product',
          model: 'Product',
    }}])
    // const orderList = await Order.aggregate(
    //     [
    //         { $match: filter },
    //         {
    //             $project: {
    //               orderItems: 1,
    //               status: 1,
    //               name: 1,
    //               shippingAddress1: 1,
    //               phone: 1,
    //               totalPrice: 1,
    //               user:1,
    //               dateOrdered:1
    //             },
    //           },
    //         {
    //             $sort: {
    //                 dateOrdered: -1,
    //             }
    //         },

    //         { $lookup: { from: 'orderItems', localField: 'orderItems', foreignField: '_id', as: 'orderItems' } },
    //         { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
    //         // {
    //         //     $addFields: {
    //         //         products: {
    //         //             $arrayElemAt: ["$products", 0],
    //         //         },
    //         //     },
    //         // },
    //     ]
    // )


    if (!orderList) {
        res.status(500).json({ success: false })
    }
    // console.log(JSON.stringify(orderList, undefined, 2))
    res.send(orderList);
})

router.get(`/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems', populate: {
                path: 'product', populate: 'category',
            }
        });

    if (!order) {
        res.status(500).json({ success: false })
    }
    res.send(order);
})

router.post('/', async (req, res) => {
        req.body.orderItems.forEach(async (item)=>{
           let product= await Product.findByIdAndUpdate(
                item.product,{ $inc: { countInStock: -item.quantity } }
                )
        })
    const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product,
            shopNo: req.body.shopNo || 1,
            price: req.body.price
        })

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }))
    const orderItemsIdsResolved = await orderItemsIds;

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice
    }))

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    let order = new Order({
        name: req.body.name,
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        // shippingAddress2: req.body.shippingAddress2,
        // city: req.body.city,
        // zip: req.body.zip,
        // country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
        shopNo: req.body.shopNo || 1
    })
    order = await order.save();

    if (!order)
        return res.status(400).send('the order cannot be created!')

    res.send(order);
})


router.put('/:id', async (req, res) => {

    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        { new: true }
    )

    if (!order)
        return res.status(400).send('the order cannot be updated!')

    res.send(order);
})


router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order => {
        if (order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({ success: true, message: 'the order is deleted!' })
        } else {
            return res.status(404).json({ success: false, message: "order not found!" })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })
})

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
    ])

    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({ totalsales: totalSales.pop().totalsales })
})

router.post('/summary', async (req, res) => {
    console.log("request -->>",res.body)
    const totalSales = await OrderItem.aggregate([
      {  $match:
        {
          shopNo: req.body.shopNo
        //   createdAt: { "$lte": new Date(req.endDate)}
        }
     },
       
        { $group: { _id: '$product',count: { $sum: '$quantity' }} },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product_detail"
            }
        },
        { $sort : { _id: 1 } }
    ])
    // console.log(totalSales, totalSales[0].product_detail)

    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({ totalsales: totalSales })
    // res.send({ })
    


})

router.get(`/get/count`, async (req, res) => {
    const orderCount = await Order.countDocuments((count) => count)

    if (!orderCount) {
        res.status(500).json({ success: false })
    }
    res.send({
        orderCount: orderCount
    });
})

router.get(`/get/userorders/:userid`, async (req, res) => {
    const userOrderList = await Order.find({ user: req.params.userid }).populate({
        path: 'orderItems', populate: {
            path: 'product', populate: 'category'
        }
    }).sort({ 'dateOrdered': -1 });

    if (!userOrderList) {
        res.status(500).json({ success: false })
    }
    res.send(userOrderList);
})



module.exports = router;