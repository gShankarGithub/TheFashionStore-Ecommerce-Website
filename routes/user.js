var express = require('express');
var router = express.Router();
var userHelper = require('../helpers/user-helpers')
var adminHelper = require('../helpers/admin-helpers');
const userHelpers = require('../helpers/user-helpers');



const serviceSID = "VA464df13e96e261c09240e9e5d16bc514"
const accountSID = "ACd9861b7ef28f4c277b12a711ef740444"
const authToken = "1ee612732f59dc02a571b0f230aee13c"
const client = require('twilio')(accountSID, authToken)


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
})
router.get('/login', (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('login', { "loginErr": req.session.userLoginErr })
    req.session.userLoginErr = false
  }
})

router.post('/login', (req, res) => {
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
})

router.get("/login/otplogin", (req, res) => {
  res.render('OTPlogin', { "loginErr": req.session.userLoginErr })
})

router.post('/login/otplogin', (req, res) => {
  let number = req.body.number
  userHelper.findUser(number).then((response) => {
    if (response.status) {
      req.session.username = response.user
      req.session.usernumber = response.user.number
      req.session.user = true
      console.log(number);
      client.verify.v2.services(serviceSID)
        .verifications
        .create({ to: `+91${req.body.number}`, channel: 'sms' })
        .then(verification => res.redirect("/login/otplogin/otpconfirm"));
    } else {
      req.session.userLoginErr = "Invalid Number"
      res.redirect('/login/otplogin')
    }
  })


})
router.get('/login/otplogin/otpconfirm', (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  res.render('OTPconfirm')
})

router.post('/login/otplogin/otpconfirm', (req, res) => {
  const { otp } = req.body
  client.verify.v2.services(serviceSID)
    .verificationChecks
    .create({ to: `+91${req.session.usernumber}`, code: otp })
    .then(verification_check => res.redirect('/'));
})

router.get('/logout', (req, res) => {
  req.session.user = null
  res.redirect('/')
})

router.get('/signup', (req, res) => {
  res.render('signup')
})

router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    res.redirect('/')
  })
})

//////////////////////////Profile Management/////////////////////////////////////////////////////

router.get('/profile', verifyLogin, async (req, res) => {
  let user = req.session.username
  let categories = await adminHelper.getAllCategory()
  let userAddress = await userHelper.getAddress(user._id)
  res.render('profile', { user, categories, userAddress })
})


router.post('/profile/edit-user', (req, res) => {
  let userDetails = req.body
  let userId = req.session.username._id
  userHelper.updateUser(userId, userDetails).then(async (response) => {
    req.session.username = null
    console.log(userId);
    req.session.username = await userHelper.getUserDetails(userId)
    res.redirect('/profile')
  })
})

router.post('/addAddressProfile', async (req, res) => {
  console.log(req.body);
  await userHelper.addAddress(req.body)
  res.redirect('/profile')
})

router.get('/deleteAddress/:id', (req, res) => {
  userHelper.deleteAddress(req.params.id).then(() => {
    res.redirect('/profile')
  })
})

router.post('/addAddress', async (req, res) => {
  console.log(req.body);
  await userHelper.addAddress(req.body)
  res.redirect('/place-order')
})

///////////////////////Shop, ProductList & Product Details///////////////////////////////////////


router.get('/shop', async (req, res) => {
  let user = req.session.username
  let categories = await adminHelper.getAllCategory()
  let cartCount = null
  if (user) {
    cartCount = await userHelper.getCartCount(user._id)
  }
  adminHelper.getAllProducts().then((products) => {
    res.render('shop', { products, user, categories, cartCount })
  })
})

router.get('/shop/product-details/:id', async (req, res) => {
  let user = req.session.username
  let categories = await adminHelper.getAllCategory()
  let cartCount = null
  if (user) {
    cartCount = await userHelper.getCartCount(user._id)
  }
  let product = await adminHelper.getProductDetails(req.params.id)
  res.render('productdetails', { product, user, categories, cartCount })
})

////////////////////Category//////////////////////

router.get('/category/:categoryName', async (req, res) => {
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
})

/////////////////////////////////////////Wishlist///////////////////////////////////////////////////////

router.get('/add-to-wishlist/:id', (req, res) => {
  userHelper.addToWishlist(req.params.id, req.session.username._id).then(() => {
    res.json({ status: true })
  })
})

router.get('/remove-from-wishlist/:id', async (req, res) => {
  await userHelper.addToWishlist(req.params.id, req.session.username._id).then(() => {
    res.redirect('/wishlist')
  })
})

router.get('/wishlist', verifyLogin, async (req, res) => {
  let user = req.session.username
  let categories = await adminHelper.getAllCategory()
  let products = await userHelper.getWishlistedProducts(req.session.username._id)
  if (products.length) {
    console.log(products);
    res.render('wishlist', { user, categories, products })
  } else {
    res.send("hello")
  }

})




/////////////////////////////////////////Cart////////////////////////////////////////////////////////////

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  userHelper.addToCart(req.params.id, req.session.username._id).then(() => {
    res.json({ status: true })
  })
})

router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.username
  let categories = await adminHelper.getAllCategory()
  let total = 0
  let offTotal =0
  let discount =0
  let products = await userHelper.getCartProducts(req.session.username._id)
  if (products.length > 0) {
    total = await userHelper.getTotalAmount(req.session.username._id)
    offTotal = await userHelper.getOfferTotalAmount(req.session.username._id)
    let discount = Math.round(Number(total - offTotal))
    res.render('cart', { products, user, total, categories, offTotal, discount })
  } else {
    res.render('empty-cart', { user, categories })
  }

})

router.post('/change-product-quantity', (req, res, next) => {
  userHelper.changeProductQuantity(req.body).then(async (response) => {
    if (response.status) {
      let total = await userHelper.getOfferTotalAmount(req.body.user)
      response.total = total
    }
    res.json(response)
  })
})

router.post('/remove-cart-item', (req, res) => {
  userHelper.removeCartItem(req.body).then((response) => {
    res.json(response)
  })
})

/////////////////////////////////////Coupon///////////////////////////////

router.post('/apply-coupon', async (req, res) => {
  console.log(req.body);
  console.log("ethi 1");
  let couponDetails = await userHelper.getCouponDetails(req.body)
  if (couponDetails) {
    let percent = parseInt(couponDetails.percent, 10)
    let offer = req.body.total * percent / 100
    let total = req.body.total - offer
    req.session.total = total
    req.session.coupon = true
    res.json(total)
  } else {
    res.json(null)
  }
})

//////////////////////////////////////////////////////////////////////////

router.get('/place-order', verifyLogin, async (req, res) => {
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
})

router.post('/place-order', async (req, res) => {

  let products = await userHelper.getCartProductList(req.body.userId)
  let totalPrice = 0
  if (products.length > 0) {
    if (req.session.coupon) {
      totalPrice = req.session.total
      console.log(totalPrice);
    } else {
      totalPrice = await userHelper.getOfferTotalAmount(req.body.userId)
    }
    req.session.coupon = null
    userHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {
      if (req.body['payment-method'] === 'COD' || 'PAYPAL') {
        res.json({ codSuccess: true })
      } else {
        userHelper.generateRazorpay(orderId, totalPrice).then((response) => {
          res.json(response)
        })
      }

    })
  }

})

router.post('/verify-payment', (req, res) => {
  let user = req.session.username
  userHelpers.verifyPayment(req.body).then(() => {
    userHelper.changePaymentStatus(req.body['order[receipt]'], user._id).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false })
  })
})

router.get('/place-order/order-success', verifyLogin, async (req, res) => {
  let user = req.session.username
  let categories = await adminHelper.getAllCategory()
  res.render('order-success', { user, categories })
})

///////////////////////////////////////ORDERS////////////////////////////////////////

router.get('/orders', verifyLogin, async (req, res) => {
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



})

router.get('/orders/products/:id', verifyLogin, async (req, res) => {
  let orderId = req.params.id
  let categories = await adminHelper.getAllCategory()
  let products = await userHelper.getAllProductsOfOrder(orderId)
  let user = req.session.username
  res.render('order-products', { user, products, categories })
})

router.get('/orders/cancel-order/:id', (req, res) => {
  userHelper.cancelOrder(req.params.id).then((response) => {
    res.redirect('/orders')
  })
})
module.exports = router;
