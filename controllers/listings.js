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

module.exports.index = async (req, res) => {
  try {
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

    // Add isFavorite property to each listing if user is logged in
    if (req.user) {
      try {
        // Populate favorites and ensure we're getting the IDs correctly
        const user = await User.findById(req.user._id).populate({
          path: "favorites",
          select: "_id",
        });

        // Debug log
        console.log("User favorites:", user.favorites);

        const favoriteIds = user.favorites.map((fav) => fav._id.toString());
        console.log("Favorite IDs:", favoriteIds);

        allListings = allListings.map((listing) => {
          const listingObj = listing.toObject();
          const listingId = listing._id.toString();
          listingObj.isFavorite = favoriteIds.includes(listingId);
          console.log(
            `Listing ${listingId} isFavorite: ${listingObj.isFavorite}`,
          );
          return listingObj;
        });
      } catch (err) {
        console.error("Error processing favorites:", err);
        // If there's an error, set all isFavorite to false
        allListings = allListings.map((listing) => {
          const listingObj = listing.toObject();
          listingObj.isFavorite = false;
          return listingObj;
        });
      }
    } else {
      // If user is not logged in, set isFavorite to false for all listings
      allListings = allListings.map((listing) => {
        const listingObj = listing.toObject();
        listingObj.isFavorite = false;
        return listingObj;
      });
    }

    res.render("./listings/index.ejs", {
      allListings,
      currentUser: req.user,
    });
  } catch (err) {
    console.error("Error in index controller:", err);
    req.flash("error", "Error loading listings");
    res.redirect("/");
  }
};

module.exports.renderNewForm = (req, res) => {
  console.log(req.user);
  res.render("./listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  try {
    let { id } = req.params;

    // Get the listing with current counts first
    const currentListing = await Listing.findById(id);
    if (!currentListing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }

    // Ensure viewCount is never negative and increment
    const updatedViewCount = Math.max(0, currentListing.viewCount || 0) + 1;

    // Update the listing with the new view count
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

    // Ensure favoriteCount is not negative
    if (listing.favoriteCount < 0) {
      listing.favoriteCount = 0;
      await listing.save();
    }

    // Check if current user has favorited this listing
    let isFavorite = false;
    if (req.user) {
      const user = await User.findById(req.user._id);
      isFavorite = user.favorites.includes(id);
    }

    res.render("listings/show.ejs", {
      listing: listing.toObject({ virtuals: true }),
      isFavorite,
      currentUser: req.user,
    });
  } catch (err) {
    console.error("Error in showListing:", err);
    req.flash("error", "Error loading listing");
    res.redirect("/listings");
  }
};

module.exports.createListing = async (req, res, next) => {
  try {
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    const imageData = getImageData(req.file);

    // Prepare listing data with proper type conversion
    const listingData = {
      ...req.body.listing,
      // Ensure numeric fields are properly converted
      price: Number(req.body.listing.price) || 0,
      securityDeposit: Math.max(
        0,
        Number(req.body.listing.securityDeposit) || 0,
      ),
      minStayMonths: Math.max(1, Number(req.body.listing.minStayMonths) || 1),
      // Ensure boolean fields are properly set
      immediateAvailability:
        req.body.listing.immediateAvailability === "on" ||
        req.body.listing.immediateAvailability === true,
      // Set default values for required fields if missing
      amenities: {
        attachedBathroom: req.body.listing.amenities?.attachedBathroom === "on",
        kitchenAccess: req.body.listing.amenities?.kitchenAccess !== "off", // default true
        wifi: req.body.listing.amenities?.wifi === "on",
        ac: req.body.listing.amenities?.ac === "on",
        laundry: req.body.listing.amenities?.laundry === "on",
        parking: req.body.listing.amenities?.parking === "on",
      },
      rules: {
        smoking: req.body.listing.rules?.smoking === "on",
        pets: req.body.listing.rules?.pets === "on",
        guests: req.body.listing.rules?.guests !== "off", // default true
        curfew: req.body.listing.rules?.curfew === "on",
        curfewDetails: req.body.listing.rules?.curfewDetails || "",
      },
      bills: {
        included: req.body.listing.bills?.included === "on",
        details: req.body.listing.bills?.details || "",
      },
    };

    console.log(
      "Processed listing data:",
      JSON.stringify(listingData, null, 2),
    );

    const newListing = new Listing(listingData);
    newListing.owner = req.user._id;
    newListing.image = imageData;

    // Validate before saving
    const validationError = newListing.validateSync();
    if (validationError) {
      console.error("Validation error:", validationError);
      throw validationError;
    }

    await newListing.save();

    req.flash("success", "New Listing Created!");
    return res.redirect("/listings");
  } catch (err) {
    console.error("Error creating listing:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      errors: err.errors,
      stack: err.stack,
    });

    let errorMessage = "Error creating listing. ";
    if (err.name === "ValidationError") {
      errorMessage += Object.values(err.errors)
        .map((e) => e.message)
        .join(" ");
    } else if (err.message) {
      errorMessage += err.message;
    } else {
      errorMessage += "Please check your input and try again.";
    }

    req.flash("error", errorMessage);
    return res.redirect("/listings/new");
  }
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Requested listing does not exist!");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  try {
    let { id } = req.params;

    // Ensure securityDeposit is a number and not negative
    const updateData = {
      ...req.body.listing,
      securityDeposit: Math.max(
        0,
        Number(req.body.listing.securityDeposit) || 0,
      ),
    };

    let listing = await Listing.findByIdAndUpdate(id, updateData, {
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

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error("Error updating listing:", err);
    req.flash("error", "Error updating listing. Please try again.");
    res.redirect(`/listings/${req.params.id}/edit`);
  }
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
