const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const DEFAULT_LISTING_IMAGE = {
  url: "/images/beautifulDestination.jpg",
  filename: "default-listing-image",
};

function getImageData(file) {
  if (!file) {
    return DEFAULT_LISTING_IMAGE;
  }

  if (file.path && /^https?:\/\//i.test(file.path)) {
    return {
      url: file.path,
      filename: file.filename,
    };
  }

  if (file.filename) {
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
    };
  }

  return DEFAULT_LISTING_IMAGE;
}

function normalizeListingData(listing = {}) {
  return {
    ...listing,
    price: Math.max(0, Number(listing.price) || 0),
    securityDeposit: Math.max(0, Number(listing.securityDeposit) || 0),
    minStayMonths: Math.max(1, Number(listing.minStayMonths) || 1),
    immediateAvailability:
      listing.immediateAvailability === true ||
      listing.immediateAvailability === "true" ||
      listing.immediateAvailability === "on",
    amenities: {
      attachedBathroom: Boolean(listing.amenities?.attachedBathroom),
      kitchenAccess:
        listing.amenities?.kitchenAccess === undefined
          ? true
          : Boolean(listing.amenities.kitchenAccess),
      wifi: Boolean(listing.amenities?.wifi),
      ac: Boolean(listing.amenities?.ac),
      laundry: Boolean(listing.amenities?.laundry),
      parking: Boolean(listing.amenities?.parking),
    },
    rules: {
      smoking: Boolean(listing.rules?.smoking),
      pets: Boolean(listing.rules?.pets),
      guests:
        listing.rules?.guests === undefined
          ? true
          : Boolean(listing.rules.guests),
      curfew: Boolean(listing.rules?.curfew),
      curfewDetails: listing.rules?.curfewDetails || "",
    },
    bills: {
      included: Boolean(listing.bills?.included),
      details: listing.bills?.details || "",
    },
  };
}

function toRenderableListing(listing) {
  const listingObj =
    typeof listing.toObject === "function"
      ? listing.toObject({ virtuals: true })
      : { ...listing };

  listingObj.image = listingObj.image?.url
    ? listingObj.image
    : DEFAULT_LISTING_IMAGE;

  if (!Array.isArray(listingObj.images)) {
    listingObj.images = [];
  }

  return listingObj;
}

module.exports.index = async (req, res) => {
  let allListings = await Listing.find({})
    .populate({
      path: "owner",
      select: "username email image",
    })
    .populate({
      path: "reviews",
      populate: {
        path: "author",
        select: "username",
      },
    });

  let favoriteIds = new Set();

  if (req.user) {
    const user = await User.findById(req.user._id).select("favorites");
    favoriteIds = new Set(
      (user?.favorites || []).map((favId) => favId.toString()),
    );
  }

  allListings = allListings.map((listing) => {
    const listingObj = toRenderableListing(listing);
    listingObj.isFavorite = favoriteIds.has(String(listing._id));
    return listingObj;
  });

  res.render("./listings/index.ejs", {
    allListings,
    currentUser: req.user,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("./listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const currentListing = await Listing.findById(id);

  if (!currentListing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  const updatedViewCount = Math.max(0, currentListing.viewCount || 0) + 1;

  const listing = await Listing.findByIdAndUpdate(
    id,
    {
      $set: {
        viewCount: updatedViewCount,
        favoriteCount: Math.max(0, currentListing.favoriteCount || 0),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  let isFavorite = false;
  if (req.user) {
    const user = await User.findById(req.user._id).select("favorites");
    isFavorite = (user?.favorites || []).some(
      (favoriteId) => favoriteId.toString() === id,
    );
  }

  res.render("listings/show.ejs", {
    listing: toRenderableListing(listing),
    isFavorite,
    currentUser: req.user,
  });
};

module.exports.createListing = async (req, res) => {
  if (!req.user) {
    req.flash("error", "Please login to continue");
    return res.redirect("/login");
  }

  const imageData = getImageData(req.file);
  const listingData = normalizeListingData(req.body.listing);

  const newListing = new Listing(listingData);
  newListing.owner = req.user._id;
  newListing.image = imageData;

  await newListing.save();

  req.flash("success", "New listing created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Requested listing does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image?.url || DEFAULT_LISTING_IMAGE.url;
  if (/^https?:\/\//i.test(originalImageUrl)) {
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  }

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const updateData = normalizeListingData(req.body.listing);

  const listing = await Listing.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!listing) {
    req.flash("error", "Requested listing does not exist!");
    return res.redirect("/listings");
  }

  if (req.file) {
    listing.image = getImageData(req.file);
    await listing.save();
  }

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);

  if (!deletedListing) {
    req.flash("error", "Requested listing does not exist!");
    return res.redirect("/listings");
  }

  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
