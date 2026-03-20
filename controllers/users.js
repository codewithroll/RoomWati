const User = require("../models/user.js");

module.exports.renderSignupform = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.renderLoginform = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password, image } = req.body;
    const newUser = new User({ email, username, image });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
      //will automatically log in the user after successful signup
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome back to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.login = (req, res) => {
  // If this is an OTP login, redirect to OTP verification page
  if (req.query.otp === "true" && req.query.email) {
    return res.redirect(
      `/verify-otp?email=${encodeURIComponent(req.query.email)}`,
    );
  }

  // For traditional login, proceed with the original flow
  const redirectUrl = req.session.returnTo || "/listings";
  delete req.session.returnTo;
  console.log("Login successful, redirecting to:", redirectUrl);
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You have been successfully logged out!");
    res.redirect("/listings");
  });
};
