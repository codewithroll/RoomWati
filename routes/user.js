const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const Listing = require("../models/listing.js");
const { isLoggedIn } = require("../middleware.js");

//signup
router
  .route("/signup")
  .get(userController.renderSignupform)
  .post(wrapAsync(userController.signup));

// Login routes
router.get("/login", userController.renderLoginform);

// Handle login form submission (both password and OTP login)
router.post(
  "/login",
  saveRedirectUrl,
  (req, res, next) => {
    console.log("Login attempt for user:", req.body.username || req.body.email);

    // Check if this is an OTP login attempt
    if (req.body.loginMethod === "otp" && req.body.email) {
      // Forward to auth router for OTP handling
      return next("route");
    }

    // Continue with traditional password login
    next();
  },
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
    successReturnToOrRedirect: "/listings",
    successFlash: "Welcome back to Wanderlust!",
    failureMessage: "Invalid username or password",
  }),
);

//logout
router.get("/logout", userController.logout);

// Toggle favorite listing
router.post(
  "/toggle-favorite/:listingId",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    console.log("Toggle favorite route hit with ID:", req.params.listingId);
    console.log("User auth status:", req.isAuthenticated());

    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Please login first" });
    }

    const { listingId } = req.params;
    const userId = req.user._id;

    try {
      console.log("Finding user with ID:", userId);
      const user = await User.findById(userId);

      if (!user) {
        console.log("User not found:", userId);
        return res.status(404).json({ error: "User not found" });
      }

      // Initialize favorites array if it doesn't exist
      if (!user.favorites) {
        console.log("Initializing favorites array for user");
        user.favorites = [];
      }

      // Convert ObjectIds to strings for comparison
      const favoriteIndex = user.favorites.findIndex(
        (id) => id.toString() === listingId,
      );
      console.log("Current favorites:", user.favorites);
      console.log("Looking for listing:", listingId);
      console.log("Found at index:", favoriteIndex);

      let result;
      if (favoriteIndex === -1) {
        // Add to favorites
        console.log("Adding to favorites");
        user.favorites.push(listingId);

        // Increment favorite count on the listing
        await Listing.findByIdAndUpdate(listingId, {
          $inc: { favoriteCount: 1 },
          $addToSet: { favoritedBy: userId },
        });
        result = {
          status: "added",
          message: "Added to favorites",
          favoriteCount: (await Listing.findById(listingId)).favoriteCount,
        };
      } else {
        // Remove from favorites
        console.log("Removing from favorites");
        user.favorites.splice(favoriteIndex, 1);

        // Decrement favorite count on the listing, ensuring it doesn't go below 0
        const listing = await Listing.findById(listingId);
        const newFavoriteCount = Math.max((listing.favoriteCount || 0) - 1, 0);

        const updatedListing = await Listing.findByIdAndUpdate(
          listingId,
          {
            $set: {
              favoriteCount: newFavoriteCount,
              favoritedBy: listing.favoritedBy.filter(
                (id) => id.toString() !== userId.toString(),
              ),
            },
          },
          { new: true },
        );

        result = {
          status: "removed",
          message: "Removed from favorites",
          favoriteCount: updatedListing.favoriteCount,
        };
      }

      // Use findByIdAndUpdate to avoid validation issues
      await User.findByIdAndUpdate(
        userId,
        {
          favorites: user.favorites,
        },
        { new: true, runValidators: false },
      );

      console.log("Successfully updated user favorites");
      res.json(result);
    } catch (error) {
      console.error("Error in toggle-favorite:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }),
);

// Profile route
router.get(
  "/profile",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
      req.session.returnTo = req.originalUrl;
      req.flash("error", "You must be logged in to view your profile");
      return res.redirect("/login");
    }

    // Get user with populated favorites
    const user = await User.findById(req.user._id).populate("favorites");

    // Get user's listings with view and favorite counts, and populate reviews
    const userListings = await Listing.find({ owner: req.user._id }).populate(
      "reviews",
    );

    // Ensure counts are not negative and calculate totals
    const stats = {
      totalViews: 0,
      totalFavorites: 0,
      totalListings: userListings.length,
      totalFavorited: user.favorites ? user.favorites.length : 0,
    };

    // Update each listing to ensure counts are not negative
    for (let i = 0; i < userListings.length; i++) {
      const listing = userListings[i];

      // Ensure counts are not negative
      if (listing.viewCount < 0) {
        listing.viewCount = 0;
        await listing.save();
      }
      if (listing.favoriteCount < 0) {
        listing.favoriteCount = 0;
        await listing.save();
      }

      // Update totals with ensured non-negative values
      stats.totalViews += listing.viewCount || 0;
      stats.totalFavorites += listing.favoriteCount || 0;
    }

    // Get favorite listings with populated data
    const favoriteListings = await Listing.find({
      _id: { $in: user.favorites || [] },
    })
      .populate("owner", "username image")
      .populate("reviews");

    res.render("users/profile.ejs", {
      user,
      userListings,
      favoriteListings,
      stats,
    });
  }),
);

// Edit Profile Form Route
router.get(
  "/profile/edit",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.render("users/edit.ejs", { user });
  }),
);

// Update Profile Route
router.put(
  "/profile",
  isLoggedIn,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  wrapAsync(async (req, res) => {
    const { username, email, bio } = req.body;
    const user = await User.findById(req.user._id);

    user.username = username;
    user.email = email;
    user.bio = bio;

    if (req.files.profileImage) {
      user.image = {
        url: req.files.profileImage[0].path,
        filename: req.files.profileImage[0].filename,
      };
    }

    if (req.files.coverImage) {
      user.coverImage = {
        url: req.files.coverImage[0].path,
        filename: req.files.coverImage[0].filename,
      };
    }

    await user.save();
    req.flash("success", "Profile updated successfully!");
    res.redirect("/profile");
  }),
);

module.exports = router;
