const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

ImageSchema.virtual("thumbnail").get(function () {
  return this.url.replace("/upload", "/upload/w_200");
});

const listingSchema = new Schema({
  // Original fields
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    url: String,
    filename: String,
  },
  images: [ImageSchema],
  price: Number,
  location: String,

  // Analytics
  viewCount: {
    type: Number,
    default: 0,
  },
  favoriteCount: {
    type: Number,
    default: 0,
  },

  // Track who favorited this listing
  favoritedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  // Room booking-specific fields
  roomType: {
    type: String,
    enum: ["single", "shared", "studio", "ensuite"],
    default: "single",
  },
  furnished: {
    type: String,
    enum: ["furnished", "unfurnished", "semifurnished"],
    default: "furnished",
  },
  genderPreference: {
    type: String,
    enum: ["male", "female", "any"],
    default: "any",
  },
  preferredTenants: {
    type: String,
    enum: ["students", "professionals", "family", "couples", "any"],
    default: "any",
  },
  immediateAvailability: {
    type: Boolean,
    default: true,
  },
  availableFrom: {
    type: Date,
    default: Date.now,
  },
  amenities: {
    attachedBathroom: {
      type: Boolean,
      default: false,
    },
    kitchenAccess: {
      type: Boolean,
      default: true,
    },
    wifi: {
      type: Boolean,
      default: false,
    },
    ac: {
      type: Boolean,
      default: false,
    },
    laundry: {
      type: Boolean,
      default: false,
    },
    parking: {
      type: Boolean,
      default: false,
    },
  },
  rules: {
    smoking: {
      type: Boolean,
      default: false,
    },
    pets: {
      type: Boolean,
      default: false,
    },
    guests: {
      type: Boolean,
      default: true,
    },
    curfew: {
      type: Boolean,
      default: false,
    },
    curfewDetails: String,
  },
  securityDeposit: {
    type: Number,
    default: 0,
    min: 0, // Ensures it's never negative
  },
  minStayMonths: {
    type: Number,
    default: 1,
  },
  bills: {
    included: {
      type: Boolean,
      default: false,
    },
    details: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Text index for full-text search
listingSchema.index({
  title: "text",
  description: "text",
  location: "text",
  country: "text",
});

// Middleware for deleting associated reviews
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
