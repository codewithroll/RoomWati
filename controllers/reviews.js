const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id); // ✅ await lagao
  let newReview = new Review(req.body.review);
  newReview.author = req.user._id;
  console.log("Creating review with author:", req.user._id);
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();

  req.flash("success", "Review Added!");
  res.redirect(`/listings/${listing._id}`); // ✅ Better UX: wapas usi page pe bhej do
};

module.exports.deleteReview = async (req, res) => {
  let { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); //yeh pull operator will search and delete the element with this entry
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review Deleted!");
  res.redirect(`/listings/${id}`);
};
