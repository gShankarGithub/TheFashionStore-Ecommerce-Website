var db = require('../config/connection')
var collection = require('../config/collections')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { response } = require('express')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
const { ADDRESS_COLLECTION } = require('../config/collections')
var instance = new Razorpay({
    key_id: 'rzp_test_gnHOww8ibn0dvS',
    key_secret: 'v9cct7Myvlmasmm6W3xDryn1',
});

module.exports = {
    doSignup: (userData) => {
        userData.isBlocked = false
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.ops)
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {

            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: userData.email, password: userData.password })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("Login Successfull");
                        response.user = user
                        console.log(user.isBlocked);
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('Login Failed');
                        resolve({ status: false })
                    }
                })
            } else if (admin) {
                console.log("Login Success admin");
                response.user = admin
                response.adminStatus = true
                resolve(response)
            }
            else {
                console.log('No User Exist');
                resolve({ status: false })
            }
        })
    },

    findUser: (userNumber) => {
        return new Promise(async (resolve, reject) => {

            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ number: userNumber })
            if (user) {
                response.user = user
                response.status = true
                resolve(response)
            }
            else {
                resolve({ status: false })
            }
        })
    },

    getUserDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            resolve(user)
        })

    },

    findProductCategory: (category) => {
        return new Promise(async (resolve, reject) => {
            let categoryProduct = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: category }).toArray()
            resolve(categoryProduct)
        })
    },
    //////////////////////////////////////////////////USER PROFILE/////////////////////////////////////////

    updateUser: (userId, userDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    name: userDetails.name,
                    email: userDetails.email,
                    number: userDetails.number
                }
            }).then((response) => {
                resolve()
            })
        })
    },

    deleteAddress: (addressId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ADDRESS_COLLECTION).remove({ _id: objectId(addressId) }).then(() => {
                resolve()
            })
        })
    },

    //////////////////////////////////////Address///////////////////////////////////////

    addAddress: (details) => {
        return new Promise((resolve, reject) => {
            details.userId = objectId(details.userId)
            db.get().collection(collection.ADDRESS_COLLECTION).insertOne(details).then((response) => {
                resolve()
            })
        })
    },

    getAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let addresses = await db.get().collection(collection.ADDRESS_COLLECTION).find({ userId: objectId(userId) }).toArray()
            resolve(addresses)
        })

    },

    //////////////////////////////////////WISHLIST///////////////////////////////////////

    addToWishlist: (proId, userId) => {
        let proObj = {
            item: objectId(proId)
        }
        return new Promise(async (resolve, reject) => {
            let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (userWishlist) {
                let prodExist = userWishlist.products.findIndex(products => products.item == proId)
                if (prodExist != -1) {
                    console.log("nope");
                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $pull: { products: proObj }
                            }
                        ).then((response) => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }
                            }
                        ).then((response) => {
                            resolve()
                        })
                }
                // db.get().collection(collection.WISHLIST_COLLECTION)
                //     .updateOne({ user: objectId(userId) },
                //         {
                //             $push: { products: objectId(proId) }
                //         }
                //     ).then((response) => {
                //         resolve()
                //     })
            } else {
                let wishlistObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishlistObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    getWishlistedProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishedItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, products: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(wishedItems)
        })
    },


    /////////////////////////////////////Cart////////////////////////////////////////////    

    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(products => products.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }
                            }
                        ).then((response) => {
                            resolve()
                        })
                }


            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }).then((response) => {
                            resolve({ status: true })
                        })
            }

        })
    },

    removeCartItem: (details) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve(response)
                })
        })
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$products.price' }] } }
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        })
    },

    getOfferTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$products.offPrice' }] } }
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        })
    },
    ////////////////////////////////////////////////////COUPON/////////////////////////////////////////////////////////////////

    getCouponDetails: (details) => {
        return new Promise(async (resolve, reject) => {
            let couponDetails = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponName: details.couponName })
            resolve(couponDetails)
        })
    },


    /////////////////////////////////////////////////////COUPON END///////////////////////////////////////////////////////////



    placeOrder: (order, products, total) => {
        return new Promise(async (resolve, reject) => {
            let status = order["payment-method"] === 'COD' || 'PAYPAL' ? 'placed' : 'pending'
            let location = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: objectId(order.addressId) })

            let orderObj = {
                deliveryDetails: {
                    mobile: location.mobile,
                    address: location.address,
                    pincode: location.pincode
                },
                userId: objectId(order.userId),
                paymentMethod: order["payment-method"],
                products: products,
                totalAmount: total,
                status: status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                if (order["payment-method"] == 'COD' || 'PAYPAL') {
                    db.get().collection(collection.CART_COLLECTION).remove({ user: objectId(order.userId) })
                }

                resolve(response.insertedId)
            })
        })

    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total,
                currency: "INR",
                receipt: "" + orderId
            }
            instance.orders.create(options, function (err, order) {
                console.log("New Order :", order);
                resolve(order)
            })

        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'v9cct7Myvlmasmm6W3xDryn1')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).remove({ user: objectId(userId) })
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }
            ).then(() => {
                resolve()
            })
        })
    },

    ///////////////////////////////////////////////////Order/////////////////////////////////////////////////////
    getAllOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).sort({ date: -1 }).toArray()
            resolve(orders)
        })
    },

    getAllProductsOfOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(orderItems)
        })
    },

    cancelOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    status: "cancelled"
                }
            }).then((response) => {
                resolve()
            })
        })
    }

}