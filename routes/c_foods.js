var express = require("express");
var router = express.Router();
var c_food = require("../models/c_food");
var Comment = require("../models/comment");
var middleware = require("../middleware")

// Image upload
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'twicesana', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// Text search
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};



//===============================================================
//INDEX  - Shows all c_food
//================================================================
router.get("/", function(req, res) {
    if(req.query.search) {
        
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
         //Get all c_food fro the DB
        c_food.find({"name": regex}, function(err, allc_food) {
            if (err) {
                console.log(err);
            }
            else {
                res.render("c_food/index", { c_food: allc_food });
            }
        });
    } else {
        //Get all c_food fro the DB
        c_food.find({}, function(err, allc_food) {
            if (err) {
                console.log(err);
            }
            else {
                res.render("c_food/index", { c_food: allc_food });
            }
        });
    }
});

//==============================================================
//CREATE - Add new c_food to DB
//===============================================================
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    console.log(req.body);
    cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url for the image to the c_food object under image property
      req.body.c_food.image = result.secure_url;
      // add author to c_food
      req.body.c_food.author = {
        id: req.user._id,
        username: req.user.username
      }
      c_food.create(req.body.c_food, function(err, c_food) {
        if (err || !c_food) {
          req.flash('error', err.message);
          return res.redirect('/c_food');
        }
        res.redirect('/c_food/' + c_food.id);
      });
    });
});

//=============================================================
//NEW - Show form to create new c_food
//=============================================================

router.get("/new",middleware.isLoggedIn, function(req, res) {
    res.render("c_food/new");
});

//===============================================================
//SHOW - Show more infor about c_food
//===============================================================

router.get("/:id", function(req, res) {
    //find the c_food with provided ID
    c_food.findById(req.params.id).populate("comments").exec(function(err, foundc_food) {
        if (err || !foundc_food) {
            req.flash("error","Something went wrong.");
            res.redirect("/c_food");
        }
        else {
            //Render show template with that c_food
            res.render("c_food/show", { c_food: foundc_food });
        }
    });
});


//EDIT ROUTE=================================================

router.get("/:id/edit", middleware.checkc_foodOwnership, function(req, res) {
    //find c_food ID in DB
    c_food.findById(req.params.id, function(err, foundc_food ) {
        if (err || !foundc_food) {
             req.flash("error","Something went wrong.");
             res.redirect("/c_food");
        } else {
            //show to the edit page
            res.render("c_food/edit",  { c_food: foundc_food }); 
        }
    
    });
});

//UPDATE ROUTE===========================================
router.put("/:id", middleware.checkc_foodOwnership, upload.single('image'), function(req, res) {
    if(req.file){
        cloudinary.uploader.upload(req.file.path, function(result) {
             
        
          // add cloudinary url for the image to the c_food object under image property
          req.body.c_food.image = result.secure_url;
          req.body.c_food.body = req.sanitize(req.body.c_food.body);
          c_food.findByIdAndUpdate(req.params.id, req.body.c_food, function(err, updatedc_food) {
                if (err || !updatedc_food) {
                    res.redirect("/c_food");
                }
                else {
                    req.flash("success","post successfully updated.");
                    res.redirect("/c_food/" + req.params.id);
        
                }
            });
    
        });

    } else {
        //senitize data
        req.body.c_food.body = req.sanitize(req.body.c_food.body);
        //find c_food ID in DB
        c_food.findByIdAndUpdate(req.params.id, req.body.c_food, function(err, updatedc_food) {
            if (err || !updatedc_food) {
                res.redirect("/c_food");
            }
            else {
                req.flash("success","post successfully updated.");
                res.redirect("/c_food/" + req.params.id);
    
            }
        });
    }
});


//DELETE ROUTE===========================================
router.delete("/:id", middleware.checkc_foodOwnership, function(req, res) {
    //find c_food ID in DB
    c_food.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
            res.redirect("/c_food");

        }
        else {
            req.flash("success","post successfully deleted.");
            res.redirect("/c_food");

        }
    });
});

module.exports = router;




