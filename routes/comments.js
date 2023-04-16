var express = require("express");
var router = express.Router({ mergeParams: true });
var Comment = require("../models/comment");
var c_food = require("../models/c_food");
var middleware = require("../middleware")
var moment = require("moment")





//=================================================================
//New comment route
//=================================================================

router.get("/new", middleware.isLoggedIn, function(req, res) {
    // find the c_food with provided ID
    c_food.findById(req.params.id, function(err, c_food) {
        if (err || !c_food) {
            req.flash("error","Something went wrong.");
            return res.redirect("/c_food");
        }
        else {
            //Render show template with that c_food
            res.render("comments/new", { c_food: c_food });
        }
    });
});

//==============================================================
//CREATE - Add new comments to DB
//==============================================================
router.post("/", middleware.isLoggedIn, function(req, res) {
    // find the c_food with provided ID
    c_food.findById(req.params.id, function(err, foundc_food) {
        if (err || !foundc_food) {
            req.flash("error","Something went wrong.");
            return res.redirect("/c_food");
        }
        else {
            Comment.create(req.body.comment, function(err, comment) {
                if (err) {
                    console.log(err);
                }
                else {
                    //add username and ID to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.author.dateAdded = moment(Date.now()).format("DD/MM/YYYY");
                    //Save comment
                     comment.save();
                    foundc_food.comments.push(comment._id);
                    foundc_food.save();
                    req.flash("success","Comment successfully added.");
                    res.redirect('/c_food/' + foundc_food._id);
                }
            });
        }
    });
});

//Comment edit route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function (req, res) {
    c_food.findById(req.params.id, function(err, foundc_food) {
        if(err || !foundc_food){
            req.flash("error", "Error has occured")
            return res.redirect("/c_food");
        }
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err) {
                req.flash("error","Something went wrong.");
                res.redirect("/c_food");
            } else {
              res.render("comments/edit", {c_food_id: req.params.id, comment: foundComment}); 
            }
        });
    })
    
});

//comment update route
router.put("/:comment_id", function(req, res) {
    //find comment ID in DB
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment) {
        if (err) {
            req.flash("error","Something went wrong.");
            res.redirect("back");
        }
        else {
            req.flash("success","Comment successfully updated.");
            res.redirect("/c_food/" + req.params.id);
        }
    });
});

//comment destroy route
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    //find Comment ID in DB
    Comment.findByIdAndRemove(req.params.comment_id, function(err) {
        if (err) {
            req.flash("error","Something went wrong.");
            res.redirect("/c_food");

        }
        else {
            req.flash("success","Comment deleted.");
            res.redirect("/c_food/" + req.params.id);

        }
    });
});




module.exports = router;
