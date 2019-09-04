var express = require('express');
var mongoose = require('mongoose');
var async = require('async');
var Customer = mongoose.model('Customer');
var User = mongoose.model('User');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, 'public/customers/images')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' +file.originalname )
  }
})

var upload = multer({ storage: storage }).single('file');

router.get('/', function(req,res,next){
    if(req.user){
        var stores = req.user.stores.map(function(val){
            return val._id;
        });
        Customer.find()
        .where({store: {$in: stores}})
        .exec(function(err, customers){
            User.findById(req.user._id)
                .populate('stores')
                .exec(function(err, user){
                    console.log({stores: user.stores, customers: customers});
                        res.send({stores: user.stores, customers: customers});
                })
        });
    }
    else{
        return res.status(403).end();
    }
});

router.post('/new', function(req, res, next){
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.log(err)
        } else if (err) {
            console.log(err)
        }
    req.body.customer = JSON.parse(req.body.customer);
     if(req.file){
      var image = fs.readFileSync(req.file.path);
      req.body.customer.image = image;
     }
      Customer.create(req.body.customer,function(error,result){
          if(error) console.log(error);
          else{
            var stores = req.user.stores.map(function(val){
                return val._id;
            });
            Customer.find()
                .where({store: {$in: stores}})
                .exec(function(err, customers){
                return res.status(200).send({customers: customers});
                });
          }
      });
 })
});

router.put('/update', function(req,res,next){
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.log(err)
        } else if (err) {
            console.log(err)
        }
    req.body.product = JSON.parse(req.body.product);
     if(req.file){
      var image = fs.readFileSync(req.file.path);
      req.body.product.image = image;
     }
      Product.findByIdAndUpdate(req.body.product._id, req.body.product,function(error,result){
          if(error) console.log(error);
          else{
            var stores = req.user.stores.map(function(val){
                return val._id;
            });
            Product.find()
                .where('quantities').elemMatch({store: {$in: stores}})
                .populate('category')
                .exec(function(err, products){
                return res.status(200).send({products: products});
                });
          }
      });
    });
});

router.delete('/', async function(req, res, next){
        async.each(req.body.customers, function(item, cb){
            Customer
            .findByIdAndRemove(item, function(err){
                if(err) cb(err);
                cb();
            })  
        }, function(err){
            if(err) next(err);
            var stores = req.user.stores.map(function(val){
                return val._id;
            });
            Customer.find()
            .where({store: {$in: stores}})
            .exec(function(err, customers){
                res.send(customers).end();
            });
        });
});

module.exports = router;