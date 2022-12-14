const e = require('express');
var express = require('express');
var router = express.Router();
var adminHelper = require('../helpers/admin-helpers')
var userHelper = require('../helpers/user-helpers')

/* GET users listing. */

router.get('/login', (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.session.admin == true) {
    res.redirect('/admin')
  } else {
    var loginErr = req.session.adminLoginErr
    res.render('admin-login', { adminLogin: true, loginErr })
    req.session.adminloginErr = false
  }

})

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.adminStatus) {
      req.session.adminname = response.user
      req.session.admin = true
      res.redirect('/admin')
    } else {
      req.session.adminLoginErr = "Invalid Username And Password"
      res.redirect('/admin/login')
    }
  })

})


router.get('/', async (req, res, next) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.session.admin == true) {
    let usersCount = await adminHelper.getUsersCount()
    let ordersCount = await adminHelper.getOrdersCount()
    let productsCount = await adminHelper.getProductsCount()
    let orders = await adminHelper.getAllTheOrders()
    let total = await adminHelper.getTotalAmountOrders()
    let weeks = await adminHelper.getWeeks()
    let months = await adminHelper.getMonths()
    let years = await adminHelper.getYears()
    /////////WEEK/////////////
    let weekYAxis = []
    let weekXAxis = []
    for (val of weeks) {
      weekYAxis.push(val.count)
      weekXAxis.push(val._id)
    }
    ////////////Month//////////////
    let monthYAxis = []
    let monthXAxis = []
    for (val of months) {
      monthYAxis.push(val.count)
      monthXAxis.push(val._id)
    }
    /////////YEAR/////////////
    let yearYAxis = []
    let yearXAxis = []
    for (val of years) {
      yearYAxis.push(val.count)
      yearXAxis.push(val._id)
    }
    res.render('admin', { admin: true, usersCount, ordersCount, productsCount, orders, total, weekYAxis, weekXAxis, monthXAxis, monthYAxis, yearXAxis, yearYAxis })
  } else {
    res.redirect('/admin/login')
  }
});

router.get('/logout', (req, res) => {
  req.session.admin = null
  res.redirect('/admin/login')
})
/////////////////////////////////BANNER//////////////////////////////////////////

router.post('/addbanner', (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.session.admin == true) {
    adminHelper.addBanner(req.body, (id) => {
      let image = req.files.bImage
      image?.mv('./public/banner-images/' + id + '.jpg', (err, done) => {
        if (!err) {
          res.redirect("/admin/banner")
        } else {
          console.log(err);
        }
      })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/banner', async (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.session.admin == true) {
    let banner = await adminHelper.getAllBanner()
    res.render('admin-banner', { admin: true, banner })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/banner/delete-banner/:id', (req, res) => {
  let bannerId = req.params.id
  adminHelper.deleteBanner(bannerId).then((response) => {
    res.redirect('/admin/banner')
  })
})


///////////////////////////USERS//////////////////////////////////////
router.get('/users', (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.session.admin == true) {
    adminHelper.getAllUsers().then((users) => {
      res.render('admin-user', { admin: true, users })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/users/block-user/:id', (req, res) => {
  adminHelper.blockUser(req.params.id).then(() => {
    res.redirect('/admin/users')
  })
})

router.get('/users/unblock-user/:id', (req, res) => {
  adminHelper.unblockUser(req.params.id).then(() => {
    res.redirect('/admin/users')
  })
})
/////////////////////////////////Coupon//////////////////////////////////////////////

router.get('/coupon', async (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  let yourDate = new Date()
  let data = yourDate.toISOString().split('T')[0]
  console.log(data);
  console.log();
  if (req.session.admin == true) {
    let coupons = await adminHelper.getAllCoupons()
    res.render('admin-coupon', { admin: true, coupons })
  } else {
    res.redirect('/admin/login')
  }

})

router.post('/coupon/add-coupon', (req, res) => {
  adminHelper.addCoupon(req.body).then(() => {
    res.redirect('/admin/coupon')
  })
})

router.get('/coupon/delete-coupon/:id', (req, res) => {
  let couponId = req.params.id
  adminHelper.deleteCoupon(couponId).then((response) => {
    res.redirect('/admin/coupon')
  })
})

////////////////////////////////Product//////////////////////////////////////////////
router.get('/products', (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.session.admin == true) {
    adminHelper.getAllProducts().then((products) => {
      res.render('admin-product', { admin: true, products })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/add-product', (req, res) => {
  adminHelper.getAllCategory().then((category) => {
    res.render('admin-addproduct', { admin: true, category })
  })

})

router.post('/add-product', (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.files) {
    console.log("got into route");
    if (req.session.admin == true) {
      adminHelper.addProduct(req.body, (id) => {
        let image = req.files.pImage
        image?.mv('./public/product-images/' + id + '.jpg', (err, done) => {
          if (!err) {
            res.redirect("/admin/products")
          } else {
            console.log(err);
          }
        })

      })
    } else {
      res.redirect('/admin/login')
    }
  } else {
    res.redirect('/admin/add-product')
  }
})

router.get('/products/delete-product/:id', (req, res) => {
  let productId = req.params.id
  adminHelper.deleteProduct(productId).then((response) => {
    res.redirect('/admin/products')
  })
})

router.get('/products/edit-product/:id', async (req, res) => {
  let product = await adminHelper.getProductDetails(req.params.id)
  let categories = await adminHelper.getAllCategory()
  res.render('admin-editproduct', { product, admin: true, categories })
})

router.post('/products/edit-product/:id', (req, res) => {
  let id = req.params.id
  adminHelper.updateProduct(req.params.id, req.body).then(() => {
    if (req.files) {
      if (req.files.pImage) {
        let image = req.files.pImage
        image.mv('./public/product-images/' + id + '.jpg')
        res.redirect('/admin/products')
      } else {
        res.redirect('/admin/products')
      }
    } else {
      res.redirect('/admin/products')
    }
  })
})

//////////////////////////////////////Category////////////////////////////////////////////////////////////
router.post('/categories/addcategory', (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.session.admin == true) {
    adminHelper.addCategory(req.body, (id) => {
      if (id == "EXIST") {
        req.session.categoryExist = true
        res.redirect("/admin/categories")
      } else {
        let image = req.files.cImage
        image?.mv('./public/category-images/' + id + '.jpg', (err, done) => {
          if (!err) {
            res.redirect("/admin/categories")
          } else {
            console.log(err);
          }
        })
      }

    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/categories', (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.session.admin == true) {
    let exist = false
    adminHelper.getAllCategory().then((category) => {
      if (req.session.categoryExist) {
        exist = req.session.categoryExist
      }
      req.session.categoryExist = null
      res.render('admin-categories', { admin: true, category, exist })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/categories/delete-category/:id', (req, res) => {
  let categoryId = req.params.id
  adminHelper.deleteCategory(categoryId).then((response) => {
    res.redirect('/admin/categories')
  })
})

router.post('/change-category-offer', (req, res) => {
  let details = req.body
  let offer = details.offer
  adminHelper.changeCategoryOffer(details).then(async () => {
    let products = await userHelper.findProductCategory(details.categoryName)
    for (val of products) {
      val.offPrice = val.price
      let price = Math.round(Number(val.offPrice - (val.offPrice * offer) / 100))
      console.log(price);
      await adminHelper.updateOffPrice(val._id, price)
    }
    res.redirect('/admin/categories')
  })
})

///////////////////////////////////////////Orders///////////////////////////////////////////

router.get('/orders', async (req, res) => {
  res.setHeader('cache-control', 'private,no-cache,no-store,must-revalidate')
  if (req.session.admin == true) {
    let orders = await adminHelper.getAllTheOrders()
    for (val of orders) {
      val.date = new Date(val.date).toLocaleDateString()
    }    res.render('admin-orders', { admin: true, orders })
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/orders/change-order-status', (req, res) => {
  adminHelper.changeOrderStatus(req.body).then((response) => {
    res.json(response)
  })
})


module.exports = router;
