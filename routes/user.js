var express = require('express');
var router = express.Router();
var userHelper = require('../helpers/user-helpers')
var adminHelper = require('../helpers/admin-helpers');
require("dotenv").config();
const userHelpers = require('../helpers/user-helpers');

const serviceSID = process.env.TWILIO_SERVICE_ID
const accountSID = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN)

router.get('/error', (req, res) => {
  let adminLogin = true
  return res.render('error', { adminLogin })

})

const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}

//////////////////////////Login And Signup///////////////////////////////

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
    let categories = await adminHelper.getAllCategory()
    let banner = await adminHelper.getAllBanner()
    if (req.session.user) {
      let user = req.session.username
      let cartCount = await userHelper.getCartCount(user._id)
      res.render('index', { admin: false, user, categories, cartCount, banner });
    } else {
      res.render('index', { admin: false, categories, banner })
    }
  } catch (error) {
    res.redirect('/error')
  }

})
router.get('/login', (req, res) => {
  try {
    res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
    if (req.session.user) {
      res.redirect('/')
    } else {
      res.render('login', { "loginErr": req.session.userLoginErr })
      req.session.userLoginErr = false
    }
  } catch (err) {
    res.redirect('/error')
  }

})

router.post('/login', (req, res) => {
  try {
    userHelper.doLogin(req.body).then((response) => {
      if (response.status) {
        if (response.user.isBlocked) {
          req.session.userLoginErr = "User Is Blocked"
          res.redirect('/login')
        } else {
          req.session.username = response.user
          req.session.user = true
          res.redirect("/")
        }
      } else {
        req.session.userLoginErr = "Invalid Username And Password"
        res.redirect('/login')
      }
    })
  } catch (error) {
    res.redirect('/error')
  }

})

router.get("/login/otplogin", (req, res) => {
  try {
    res.render('OTPlogin', { "loginErr": req.session.userLoginErr })
  } catch (error) {
    res.redirect('/error')
  }

})

router.post('/login/otplogin', (req, res) => {
  try {
    let number = req.body.number
    userHelper.findUser(number).then((response) => {
      if (response.status) {
        req.session.username = response.user
        req.session.usernumber = response.user.number
        req.session.user = true
        client.verify.v2.services(serviceSID)
          .verifications
          .create({ to: `+91${req.body.number}`, channel: 'sms' })
          .then(verification => res.redirect("/login/otplogin/otpconfirm"));
      } else {
        req.session.userLoginErr = "Invalid Number"
        res.redirect('/login/otplogin')
      }
    })
  } catch (error) {
    res.redirect('/error')
  }

})

router.get('/login/otplogin/otpconfirm', (req, res) => {
  try {
    res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
    res.render('OTPconfirm')
  } catch (error) {
    res.redirect('/error')
  }

})

router.post('/login/otplogin/otpconfirm', (req, res) => {
  try {
    const { otp } = req.body
    client.verify.v2.services(serviceSID)
      .verificationChecks
      .create({ to: `+91${req.session.usernumber}`, code: otp })
      .then(verification_check => res.redirect('/'));
  } catch (error) {
    res.redirect('/error')
  }

})

router.get('/logout', (req, res) => {
  try {
    req.session.user = null
    req.session.destroy()
    res.redirect('/')
  } catch (err) {
    res.redirect('/error')
  }
})

router.get('/signup', (req, res) => {
  try {
    res.render('signup')
  } catch (error) {
    res.redirect('/error')
  }
})

router.post('/signup', (req, res) => {
  try {
    userHelper.doSignup(req.body).then((response) => {
      res.redirect('/')
    })
  } catch (error) {
    res.redirect('/error')
  }

})

//////////////////////////Profile Management/////////////////////////////////////////////////////

router.get('/profile', verifyLogin, async (req, res) => {
  try {
    let user = req.session.username
    if (user) {
      cartCount = await userHelper.getCartCount(user._id)
    }
    let categories = await adminHelper.getAllCategory()
    let userAddress = await userHelper.getAddress(user._id)
    res.render('profile', { user, categories, userAddress, cartCount })
  } catch (err) {
    res.redirect('/error')
  }

})

router.post('/profile/edit-user', (req, res) => {
  try {
    let userDetails = req.body
    let userId = req.session.username._id
    userHelper.updateUser(userId, userDetails).then(async (response) => {
      req.session.username = null
      req.session.username = await userHelper.getUserDetails(userId)
      res.redirect('/profile')
    })
  } catch (err) {
    res.redirect('/error')
  }
})

router.post('/addAddressProfile', async (req, res) => {
  try {
    await userHelper.addAddress(req.body)
    res.redirect('/profile')
  } catch (err) {
    res.redirect('/error')
  }
})

router.get('/deleteAddress/:id', (req, res) => {
  try {
    userHelper.deleteAddress(req.params.id).then(() => {
      res.redirect('/profile')
    })
  } catch (err) {
    res.redirect('/error')
  }

})

router.post('/addAddress', async (req, res) => {
  try {
    await userHelper.addAddress(req.body)
    res.redirect('/place-order')
  } catch (err) {
    res.redirect('/error')
  }
})



///////////////////////Shop, ProductList & Product Details///////////////////////////////////////

router.get('/shop', async (req, res) => {
  try {
    res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
    let user
    let categories = await adminHelper.getAllCategory()
    let cartCount = null
    if (req.session.username) {
      user = req.session.username
      cartCount = await userHelper.getCartCount(user._id)
    }
    adminHelper.getAllProducts().then((products) => {
      res.render('shop', { products, user, categories, cartCount })
    })
  } catch (err) {
    res.redirect('/error')
  }

})

router.get('/shop/product-details/:id', async (req, res) => {
  try {
    res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
    let user = req.session.username
    let categories = await adminHelper.getAllCategory()
    let cartCount = null
    if (user) {
      cartCount = await userHelper.getCartCount(user._id)
    }
    let product = await adminHelper.getProductDetails(req.params.id)
    let relatedProducts = await userHelper.findRelatedProductCategory(product.category)

    res.render('productdetails', { product, user, categories, cartCount, relatedProducts })
  } catch (err) {
    res.redirect('/error')
  }

})

////////////////////Category//////////////////////

router.get('/category/:categoryName', async (req, res) => {
  try {
    res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
    let user = req.session.username
    let categories = await adminHelper.getAllCategory()
    let category = req.params.categoryName
    let cartCount = null
    if (user) {
      cartCount = await userHelper.getCartCount(user._id)
    }
    userHelper.findProductCategory(category).then((product) => {
      res.render('categories', { product, category, categories, user, cartCount })
    })
  } catch (error) {
    res.redirect('/error')
  }

})

/////////////////////////////////////////Wishlist///////////////////////////////////////////////////////

router.get('/add-to-wishlist/:id', (req, res) => {
  try {
    userHelper.addToWishlist(req.params.id, req.session.username._id).then(() => {
      res.json({ status: true })
    })
  } catch (error) {
    res.redirect('/error')
  }

})

router.get('/remove-from-wishlist/:id', async (req, res) => {
  try {
    await userHelper.addToWishlist(req.params.id, req.session.username._id).then(() => {
      res.redirect('/wishlist')
    })
  } catch (error) {
    res.redirect('/error')
  }

})

router.get('/wishlist', verifyLogin, async (req, res) => {
  try {
    let user = req.session.username
    if (user) {
      cartCount = await userHelper.getCartCount(user._id)
    }
    let categories = await adminHelper.getAllCategory()
    let products = await userHelper.getWishlistedProducts(req.session.username._id)
    if (products.length) {
      res.render('wishlist', { user, categories, products, cartCount })
    } else {
      res.render('zero-orders', { user, categories, cartCount })
    }
  } catch (error) {
    res.redirect('/error')
  }

})

/////////////////////////////////////////Cart////////////////////////////////////////////////////////////

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  try {
    userHelper.addToCart(req.params.id, req.session.username._id).then(() => {
      res.json({ status: true })
    })
  } catch (error) {
    res.redirect('/error')
  }
})

router.get('/cart', verifyLogin, async (req, res) => {
  try {
    let user = req.session.username
    let categories = await adminHelper.getAllCategory()
    let total = 0
    let offTotal = 0
    let discount = 0
    let products = await userHelper.getCartProducts(req.session.username._id)
    if (products.length > 0) {
      total = await userHelper.getTotalAmount(req.session.username._id)
      offTotal = await userHelper.getOfferTotalAmount(req.session.username._id)
      let discount = Math.round(Number(total - offTotal))
      res.render('cart', { products, user, total, categories, offTotal, discount })
    } else {
      res.render('empty-cart', { user, categories })
    }
  } catch (error) {
    res.redirect('/error')
  }

})

router.post('/change-product-quantity', (req, res, next) => {
  try {
    userHelper.changeProductQuantity(req.body).then(async (response) => {
      if (response.status) {
        let total = await userHelper.getOfferTotalAmount(req.body.user)
        response.total = total
      }
      res.json(response)
    })
  } catch (error) {
    res.redirect('/error')
  }
})

router.post('/remove-cart-item', (req, res) => {
  try {
    userHelper.removeCartItem(req.body).then((response) => {
      res.json(response)
    })
  } catch (error) {
    res.redirect('/error')
  }
})

/////////////////////////////////////Coupon///////////////////////////////////

router.post('/apply-coupon', async (req, res) => {
  try {
    let response = {}
    console.log(req.body);
    if (req.body.couponName == '') {
      response.ogTotal = req.body.total
      response.noCoupon = true
      res.json(response)
    } else {
      let couponDetails = await userHelper.getCouponDetails(req.body)
      console.log(couponDetails.expDate);
      if (couponDetails) {
        let todayDate = new Date().toISOString().split('T')[0]
        if (couponDetails.expDate < todayDate) {
          response.ogTotal = req.body.total
          response.expired = true
          res.json(response)
        } else {
          let margin = parseInt(couponDetails.discountMargin,10)
          if(req.body.total > margin){
            userHelper.checkIfCouponUsed(couponDetails._id, req.session.username._id).then((details) => {
              if (details.couponAdd) {
                let percent = parseInt(couponDetails.percent, 10)
                let offer = req.body.total * percent / 100
                let total = req.body.total - offer
                response.total = total
                response.discount = offer
                response.ogTotal = req.body.total
                req.session.total = total
                req.session.coupon = true
                res.json(response)
              } else if (details.exist) {
                response.ogTotal = req.body.total
                response.used = true
                res.json(response)
              }
            })
          }else{
            let amount = margin - req.body.total
            response.ogTotal = req.body.total
            response.limit = "Shop For ₹"+amount+" More To Avail Coupon"
            res.json(response)
          }
        }
      } else {
        response.noExist = true
        res.json(response)
      }
    }
  } catch (error) {
    res.redirect('/error')
  }
})

//////////////////////////////////////////////////////////////////////////////

router.get('/place-order', verifyLogin, async (req, res) => {
  try {
    let products = await userHelper.getCartProducts(req.session.username._id)
    let categories = await adminHelper.getAllCategory()
    let address = await userHelper.getAddress(req.session.username._id)
    let coupons = await adminHelper.getAllCoupons()
    let total = 0
    if (products.length > 0) {
      total = await userHelper.getOfferTotalAmount(req.session.username._id)
      let user = req.session.username
      res.render('place-order', { user, total, categories, address, coupons })
    } else {
      res.redirect('/cart')
    }
  } catch (error) {
    res.redirect('/error')
  }
})

router.post('/place-order', async (req, res) => {
  try {
    let products = await userHelper.getCartProductList(req.body.userId)
    let totalPrice = 0
    if (products.length > 0) {
      if (req.session.coupon) {
        totalPrice = req.session.total
      } else {
        totalPrice = await userHelper.getOfferTotalAmount(req.body.userId)
      }
      req.session.coupon = null
      userHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {
        if (req.body['payment-method'] === 'COD') {
          res.json({ codSuccess: true })
        } else if (req.body['payment-method'] === 'PAYPAL') {
          res.json({ codSuccess: true })
        }
        else {
          userHelper.generateRazorpay(orderId, totalPrice).then((response) => {
            res.json(response)
          })
        }
      })
    }
  } catch (error) {
    res.redirect('/error')
  }
})

router.post('/verify-payment', (req, res) => {
  try {
    let user = req.session.username
    userHelpers.verifyPayment(req.body).then(() => {
      userHelper.changePaymentStatus(req.body['order[receipt]'], user._id).then(() => {
        res.json({ status: true })
      })
    }).catch((err) => {
      res.json({ status: false })
    })
  } catch (error) {
    res.redirect('/error')
  }

})

router.get('/place-order/order-success', verifyLogin, async (req, res) => {
  try {
    let user = req.session.username
    let categories = await adminHelper.getAllCategory()
    res.render('order-success', { user, categories })
  } catch (error) {
    res.redirect('/error')
  }
})

///////////////////////////////////////ORDERS////////////////////////////////////////

router.get('/orders', verifyLogin, async (req, res) => {
  try {
    let user = req.session.username
    let categories = await adminHelper.getAllCategory()
    let userId = req.session.username._id
    let orders = await userHelper.getAllOrders(userId)
    for (val of orders) {
      val.date = new Date(val.date).toLocaleDateString()
    }
    let count = Object.keys(orders).length
    if (count) {
      res.render('order-list', { orders, user, categories })
    } else {
      res.render('zero-orders', { user, categories })
    }
  } catch (error) {
    res.redirect('/error')
  }
})

router.get('/orders/products/:id', verifyLogin, async (req, res) => {
  try {
    let orderId = req.params.id
    let categories = await adminHelper.getAllCategory()
    let products = await userHelper.getAllProductsOfOrder(orderId)
    let user = req.session.username
    res.render('order-products', { user, products, categories })
  } catch (error) {
    res.redirect('/error')
  }
})

router.get('/orders/cancel-order/:id', (req, res) => {
  try {
    userHelper.cancelOrder(req.params.id).then((response) => {
      res.redirect('/orders')
    })
  } catch (error) {
    res.redirect('/error')
  }
})
module.exports = router;