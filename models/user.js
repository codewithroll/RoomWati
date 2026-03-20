const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  googleId: String,
  facebookId: String,
  appleId: String,
  bio: {
    type: String,
    default:
      "Hey there! I'm using SKN-ACKOMMODATION to find and share amazing places.",
  },
  image: {
    url: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2018/11/13/22/01/avatar-3814081_1280.png",
    },
    filename: String,
  },
  coverImage: {
    url: {
      type: String,
      default:
        "https://res.cloudinary.com/dxqjlxgsh/image/upload/v1703420360/SKN-ACKOMMODATION/default-cover_kxn8dr.jpg",
    },
    filename: String,
  },
  favorites: [
    {
      type: Schema.Types.ObjectId,
      ref: "Listing",
    },
  ],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
