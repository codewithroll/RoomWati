const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// Data endpoint for listings
router.get(
  "/data",
  wrapAsync(async (req, res) => {
    const listings = await Listing.find({});
    res.json(listings);
  }),
);

//Home route
router.get(
  "/home",
  wrapAsync(async (req, res) => {
    res.render("./listings/home.ejs", { currentUser: req.user });
  }),
);

//inn dono routes(index and create) k path jo tha wo same tha i.e., '/', isiliye humne router.route ka use krke same path walo ko sath mein likh liya
router
  .route("/")
  .get(
    wrapAsync(listingController.index), //shifted the callback in controllers, index is the name of middleware created there.
  )
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing),
  );

//new route
router.get("/new", isLoggedIn, listingController.renderNewForm);

//same with show,delete and update routes
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing),
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

//create route
// router.post("/listings",async (req,res,next)=>{
// try{
//     // let {title, description, image, price, location, country} = req.body;
// // let listing = req.body.listing;
// const newListing = new Listing(req.body.listing);
// await newListing.save();
// res.redirect("/listings");
// } catch(err){
//     next(err);
// }

//edit route

router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm),
);

module.exports = router;
