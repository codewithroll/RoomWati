const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { ListingSchema, reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "Please login to continue");
    return res.redirect("/login");
  }

  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  } else if (req.query.returnTo) {
    res.locals.returnTo = req.query.returnTo;
    req.session.returnTo = req.query.returnTo;
  } else if (
    req.originalUrl &&
    req.originalUrl !== "/login" &&
    req.originalUrl !== "/signup"
  ) {
    req.session.returnTo = req.originalUrl;
    res.locals.returnTo = req.originalUrl;
  }

  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Requested listing does not exist!");
    return res.redirect("/listings");
  }

  if (
    !res.locals.currUser ||
    !listing.owner ||
    !listing.owner.equals(res.locals.currUser._id)
  ) {
    req.flash("error", "Only owners can edit a listing");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

function convertStringBooleans(listing) {
  const booleanFields = [
    "immediateAvailability",
    "amenities.attachedBathroom",
    "amenities.kitchenAccess",
    "amenities.wifi",
    "amenities.ac",
    "amenities.laundry",
    "amenities.parking",
    "rules.smoking",
    "rules.pets",
    "rules.guests",
    "rules.curfew",
    "bills.included",
  ];

  for (const field of booleanFields) {
    const keys = field.split(".");
    let obj = listing;

    for (let i = 0; i < keys.length - 1; i += 1) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }

    const key = keys[keys.length - 1];

    if (obj[key] === "on") obj[key] = true;
    else if (obj[key] === "off") obj[key] = false;
  }

  return listing;
}

module.exports.validateListing = (req, res, next) => {
  if (req.body.listing) {
    req.body.listing = convertStringBooleans(req.body.listing);
  }

  const { error, value } = ListingSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  }

  req.body = value;
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error, value } = reviewSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  }

  req.body = value;
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);

  if (
    !review ||
    !res.locals.currUser ||
    !review.author.equals(res.locals.currUser._id)
  ) {
    req.flash("error", "Only the author of this review can delete it");
    return res.redirect(`/listings/${id}`);
  }

  next();
};
