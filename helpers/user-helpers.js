var db = require('../config/connection')
var collection = require('../config/collections')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId

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
                console.log("successs");
                resolve({ status: false })
            }
        })
    },

    findProductCategory: (category) => {
        return new Promise(async (resolve, reject) => {
            let categoryProduct = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: category }).toArray()
            resolve(categoryProduct)
        })
    },

    /////////////////////////////////////Cart////////////////////////////////////////////    

    addToCart: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ user: objectId(userId) },
                        {
                            $push: { products: objectId(proId) }
                        }
                    ).then((response) => {
                        resolve()
                    })

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [objectId(proId)]
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
                    $lookup: {
                        from: 'product',
                        let: { prodList: '$product' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$_id', "$$prodList"]
                                    }
                                }
                            }
                        ],
                        as: 'cartItems'
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    }

}