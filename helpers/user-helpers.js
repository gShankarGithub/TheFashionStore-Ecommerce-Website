var db = require('../config/connection')
var collection = require('../config/collections')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')

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
                console.log(response.user.isAdmin);
                response.status = true
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
                response.user=user
                response.status = true
                resolve(response)
            }
            else {
                console.log("successs");
                resolve({ status: false })
            }
        })
    }

}