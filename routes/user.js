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
  wrapAsync(async (req, res, next) => {
    const identifier = String(req.body.username || "").trim();
    const wantsJson =
      req.is("application/json") || req.get("x-requested-with") === "XMLHttpRequest";

    if (!identifier || !req.body.password) {
      if (wantsJson) {
        return res.status(400).json({
          success: false,
          message: "Username/email and password are required",
        });
      }

      req.flash("error", "Username/email and password are required");
      return res.redirect("/login");
    }

    if (identifier.includes("@")) {
      const user = await User.findOne({ email: identifier.toLowerCase() });
      req.body.username = user ? user.username : identifier;
    }

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        if (wantsJson) {
          return res.status(401).json({
            success: false,
            message: info?.message || "Invalid username or password",
          });
        }

        req.flash("error", info?.message || "Invalid username or password");
        return res.redirect("/login");
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }

        const redirectUrl = req.session.returnTo || "/listings";
        delete req.session.returnTo;
        req.flash("success", "Welcome back to Wanderlust!");

        if (wantsJson) {
          return res.json({
            success: true,
            redirectUrl,
          });
        }

        return res.redirect(redirectUrl);
      });
    })(req, res, next);
  }),
);

//logout
router.get("/logout", userController.logout);
router.post("/logout", userController.logout);

// Toggle favorite listing
router.post(
  "/toggle-favorite/:listingId",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { listingId } = req.params;
    const userId = req.user._id;

    const [user, listing] = await Promise.all([
      User.findById(userId),
      Listing.findById(listingId),
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const isAlreadyFavorite = (user.favorites || []).some(
      (favoriteId) => favoriteId.toString() === listingId,
    );

    if (isAlreadyFavorite) {
      user.favorites = (user.favorites || []).filter(
        (favoriteId) => favoriteId.toString() !== listingId,
      );
      listing.favoritedBy = (listing.favoritedBy || []).filter(
        (favoriteUserId) => favoriteUserId.toString() !== userId.toString(),
      );
    } else {
      user.favorites.push(listing._id);
      if (
        !(listing.favoritedBy || []).some(
          (favoriteUserId) => favoriteUserId.toString() === userId.toString(),
        )
      ) {
        listing.favoritedBy.push(userId);
      }
    }

    listing.favoriteCount = listing.favoritedBy.length;

    await Promise.all([
      user.save({ validateBeforeSave: false }),
      listing.save(),
    ]);

    res.json({
      status: isAlreadyFavorite ? "removed" : "added",
      message: isAlreadyFavorite
        ? "Removed from favorites"
        : "Added to favorites",
      favoriteCount: listing.favoriteCount,
    });
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

    if (req.files?.profileImage?.length) {
      user.image = {
        url: req.files.profileImage[0].path,
        filename: req.files.profileImage[0].filename,
      };
    }

    if (req.files?.coverImage?.length) {
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

router.get(
  "/api/user/listings",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const timeframe = Math.max(1, Number(req.query.timeframe) || 30);
    const since = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

    const listings = await Listing.find({ owner: req.user._id })
      .populate("reviews")
      .sort({ updatedAt: -1, createdAt: -1 });

    const payload = listings.map((listing) => ({
      _id: listing._id,
      id: listing._id.toString(),
      title: listing.title,
      price: listing.price || 0,
      location: listing.location || "",
      country: listing.country || "",
      viewCount: Math.max(0, listing.viewCount || 0),
      favoriteCount: Math.max(0, listing.favoriteCount || 0),
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt || listing.createdAt,
      reviews: (listing.reviews || []).filter((review) => {
        return !review.createdAt || review.createdAt >= since;
      }),
    }));

    res.json(payload);
  }),
);

module.exports = router;
