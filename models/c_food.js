var mongoose = require("mongoose");

var c_foodchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    price: String,
    author:{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
      }
   ]
});

module.exports = mongoose.model("c_food", c_foodchema);