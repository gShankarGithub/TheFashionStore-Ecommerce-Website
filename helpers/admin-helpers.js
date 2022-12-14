var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
module.exports = {

    addProduct: (product, callback) => {
        product.offPrice = parseInt(product.price, 10)
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let log = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(log)
        })
    },

    blockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    isBlocked: true
                }
            }).then((response) => {
                resolve()
            })
        })
    },

    unblockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    isBlocked: false
                }
            }).then((response) => {
                resolve()
            })
        })
    },

    addBanner: (banner, callback) => {
        db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((data) => {
            callback(data.insertedId)
        })
    },

    getAllBanner: () => {
        return new Promise(async (resolve, reject) => {
            let banner = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banner)
        })
    },

    deleteBanner: (bannerid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).remove({ _id: objectId(bannerid) }).then((response) => {
                resolve(response)
            })
        })
    },

    addCoupon: (couponData) => {
        couponData.status = "ACTIVE"
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).insertOne(couponData).then(() => {
                resolve()
            })
        })
    },
    deleteCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).remove({ _id: objectId(couponId) }).then((response) => {
                resolve(response)
            })
        })
    },

    getAllCoupons: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupons)
        })
    },
    /////////////////////////////////////CATEGORY/////////////////////////////////////////////////
    addCategory: async (category, callback) => {
        category.categoryName = category.categoryName.toLowerCase()
        let catExist = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ categoryName: category.categoryName })
        if (catExist) {
            let catErr = "EXIST"
            callback(catErr)
        } else {
            category.offer = 0
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data) => {
                callback(data.insertedId)
            })
        }

    },
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },
    deleteCategory: (categoryId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).remove({ _id: objectId(categoryId) }).then((response) => {
                resolve(response)
            })
        })
    },

    changeCategoryOffer: (categoryDetails) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(categoryDetails.categoryId) }, {
                $set: {
                    offer: categoryDetails.offer
                }
            }).then((response) => {
                resolve()
            })
        })
    },

    updateOffPrice: (proId, price) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    offPrice: price
                }
            }).then(() => {
                resolve()
            })
        })
    },

    ////////////////////////////////END CATEGORY////////////////////////////////////////
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).remove({ _id: objectId(productId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            try{
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) }).then((product) => {
                    resolve(product)
                })
            } catch (err){
                reject()
                
            }
        })
    },
    updateProduct: (productId, productDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(productId) }, {
                $set: {
                    pName: productDetails.pName,
                    category: productDetails.category,
                    price: productDetails.price,
                    description: productDetails.description
                }
            }).then(() => {
                resolve()
            })
        })
    },

    getAllTheOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().sort({date:-1}).toArray()
            resolve(orders)
        })

    },

    getAllDelieveredOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({status:delivered}).toArray()
            resolve(orders)
        })

    },

    changeOrderStatus: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(details.order) }, {
                $set: {
                    status: details.status
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },

    getUsersCount: () => {
        return new Promise(async (resolve, reject) => {
            let usersCount = await db.get().collection(collection.USER_COLLECTION).count()
            resolve(usersCount)
        })
    },

    getProductsCount: () => {
        return new Promise(async (resolve, reject) => {
            let productsCount = await db.get().collection(collection.PRODUCT_COLLECTION).count()
            resolve(productsCount)
        })
    },

    getOrdersCount: () => {
        return new Promise(async (resolve, reject) => {
            let ordersCount = await db.get().collection(collection.ORDER_COLLECTION).find({ status: { $ne: "cancelled" } }).count()
            resolve(ordersCount)
        })
    },

    getTotalAmountOrders: () => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { status: 'delivered' }
                },
                {
                    $project: {
                        _id: 0,
                        total: '$totalAmount'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$total' }
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        })
    },
    getWeeks: () => {
        return new Promise(async (resolve, reject) => {
            let weeks = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(new Date() - 7 * 7 * 60 * 60 * 24 * 1000)
                        },
                    }
                },
                {
                    $project: {
                        date: '$date',
                        week: { $week: "$date" },
                    },
                },
                {
                    $group: {
                        _id: "$week",
                        count: { $sum: 1 },
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                },

            ]).toArray()
            resolve(weeks)
        })
    },

    getMonths: () => {
        return new Promise(async (resolve, reject) => {
            let month = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(new Date().getMonth() - 10)
                        },
                    }
                },
                {
                    $project: {
                        date: '$date',
                        month: { $month: "$date" },
                    },
                },
                {
                    $group: {
                        _id: "$month",
                        count: { $sum: 1 },
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                },

            ]).toArray()
            resolve(month)
        })
    },

    getYears: () => {
        return new Promise(async (resolve, reject) => {
            let year = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(new Date().getYear() - 10)
                        },
                    }
                },
                {
                    $project: {
                        date: '$date',
                        year: { $year: "$date" },
                    },
                },
                {
                    $group: {
                        _id: "$year",
                        count: { $sum: 1 },
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                },

            ]).toArray()
            resolve(year)
        })
    }

}