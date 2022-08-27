var express = require('express');
var router = express.Router();
var userHelper = require('../helpers/user-helpers')
var adminHelper = require('../helpers/admin-helpers')

const serviceSID = "VA464df13e96e261c09240e9e5d16bc514"
const accountSID = "ACd9861b7ef28f4c277b12a711ef740444"
const authToken = "1b60bd11192e9f4c31b2ee12fc750a43"
const client = require('twilio')(accountSID, authToken)

/* GET home page. */
router.get('/', function (req, res, next) {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.session.user) {
    let user = req.session.username
    res.render('index', { admin: false, user });
  } else {
    res.render('index', { admin: false })
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
      if (response.user.isAdmin) {
        req.session.adminname = response.user
        req.session.admin = true
        res.redirect('/admin')
      } else {
        if (response.user.isBlocked) {
          req.session.userLoginErr = "User Is Blocked"
          res.redirect('/login')
        } else {
          req.session.username = response.user
          req.session.user = true
          res.redirect("/")
        }
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
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${req.body.number}`,
          channel: "sms"
        })
        .then((response) => {
          res.redirect('/login/otplogin/otpconfirm')
        })
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
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: `+91${req.session.usernumber}`,
      code: otp
    })
    .then((resp) => {
      res.redirect('/')
    })
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

router.get('/productdetails', (req, res) => {
  res.render('productdetails')
})

router.get('/shop', (req, res) => {
  let user = req.session.username
  adminHelper.getAllProducts().then((products) => {
    res.render('shop', { products, user })
  })
})

router.get('/shop/product-details/:id', async (req, res) => {
  let product = await adminHelper.getProductDetails(req.params.id)
  res.render('productdetails', { product })
})
module.exports = router;
