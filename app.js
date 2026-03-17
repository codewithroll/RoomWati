if (process.env.NODE_ENV != "production") {
  //production env mein yeh wala data koi access na kr paaye isiliye (aage ka kaam h)
  require("dotenv").config();
}
// console.log(process.env.SECRET); .env ka data access krne ka tareeka
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingRouter = require("./routes/listings.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const authRouter = require("./routes/auth.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
require("./passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const emailjs = require("emailjs-com");

const Listing = require("./models/listing.js"); // add this near your imports
const initData = require("./init/data.js"); // this too, at the top with imports

// Initialize EmailJS
emailjs.init(process.env.EMAILJS_PUBLIC_KEY);

port = 8080;

// let mongo_url = "mongodb://127.0.0.1:27017/wanderlust";
dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("DB working fine");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, //Date.now() miliseconds mein time deta h isiliye humne next seven days ko miliseconds mein convert krke add kra so that cookie agle 7 din tk saved rahe
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, //security k liye use krte h basically
  },
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async (req, res, next) => {
  if (req.user) {
    res.locals.currentUser = req.user;
  } else {
    res.locals.currentUser = null;
  }
  next();
});

app.use((req, res, next) => {
  res.locals.success = [];
  res.locals.error = [];

  if (req.session.welcomeMessage && req.session.welcomeMessageShown === false) {
    res.locals.welcomeMessage = req.session.welcomeMessage;
    res.locals.showWelcomeMessage = true;
    req.session.welcomeMessageShown = true;

    setTimeout(() => {
      delete req.session.welcomeMessage;
      delete req.session.welcomeMessageShown;
    }, 100);
  }

  const successMsgs = req.flash("success");
  const errorMsgs = req.flash("error");

  if (successMsgs && successMsgs.length) {
    res.locals.success = Array.isArray(successMsgs)
      ? successMsgs
      : [successMsgs];
  }

  if (errorMsgs && errorMsgs.length) {
    res.locals.error = Array.isArray(errorMsgs) ? errorMsgs : [errorMsgs];
  }

  res.locals.currUser = req.user;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/listings/home");
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(userRouter);

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);

app.use("/auth", authRouter);

// OTP Verification Page
app.get("/verify-otp", (req, res) => {
  const { email, reset } = req.query;
  if (!email) {
    req.flash("error", "Email is required for OTP verification");
    return res.redirect("/login");
  }
  res.render("users/verify-otp", { email, isPasswordReset: reset === "true" });
});

// Forgot Password Page
app.get("/forgot-password", (req, res) => {
  res.render("users/forgot-password");
});

// Reset Password Page
app.get("/reset-password", (req, res) => {
  const { token } = req.query;
  if (!token) {
    req.flash("error", "Invalid or expired reset link");
    return res.redirect("/forgot-password");
  }
  res.render("users/reset-password", { token });
});

// 👇 Create "Team Roomwati" user route
app.get("/create-roomwati-user", async (req, res) => {
  try {
    const newUser = new User({
      email: "team@roomwati.com",
      username: "Team Roomwati",
      bio: "We're the RoomWati team, powering seamless stays and unique spaces.",
      image: {
        url: "https://cdn.pixabay.com/photo/2018/11/13/22/01/avatar-3814081_1280.png",
        filename: "default-avatar",
      },
      coverImage: {
        url: "https://res.cloudinary.com/dxqjlxgsh/image/upload/v1703420360/RoomWati/default-cover_kxn8dr.jpg",
        filename: "default-cover",
      },
    });

    const registeredUser = await User.register(newUser, "roomwati123");
    res.send(`✅ Created user 'Team Roomwati' with ID: ${registeredUser._id}`);
  } catch (err) {
    console.error("❌ Error creating Team Roomwati user:", err);
    res.status(500).send("❌ Could not create Team Roomwati user.");
  }
});

// 👇 Seed route using "Team Roomwati" user ID
app.get("/seed", async (req, res) => {
  try {
    const ownerId = "6862f0a5e13ae10af456daa7"; // <== Paste Team Roomwati _id here
    await Listing.deleteMany({});

    const listings = initData.data.map((obj) => ({
      ...obj,
      owner: ownerId,
    }));

    await Listing.insertMany(listings);
    res.send("✅ Database seeded with sample listings.");
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    res.status(500).send("❌ Seeding failed.");
  }
});

// 👇 Route to delete seeded listings
app.get("/delete-seed", async (req, res) => {
  try {
    await Listing.deleteMany({});
    res.send("🗑️ All seeded listings deleted.");
  } catch (err) {
    console.error("❌ Error deleting listings:", err);
    res.status(500).send("❌ Failed to delete listings.");
  }
});

// GOOGLE
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/signup",
  }),
  (req, res) => {
    res.redirect("/listings");
  },
);

// FACEBOOK
app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] }),
);

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/signup",
  }),
  (req, res) => {
    res.redirect("/listings");
  },
);

// Handle 404 errors
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

// middleware to handle server side errors
app.use((err, req, res, next) => {
  //res.send("Something went wrong!"); //normal way
  let { statusCode = 500, message = "Something went wrong!" } = err;
  // res.status(statusCode).send(message);  //using ExpressError class (custom error)

  res.status(statusCode).render("error.ejs", { message });
});

app.listen(port, () => {
  console.log(`Listening at port:  ${port}`);
});
