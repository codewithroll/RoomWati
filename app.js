if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const emailjs = require("emailjs-com");

const ExpressError = require("./utils/ExpressError.js");
const listingRouter = require("./routes/listings.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const authRouter = require("./routes/auth.js");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const initData = require("./init/data.js");

require("./passport");

const app = express();
const hasGoogleOAuth =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);
const hasFacebookOAuth =
  Boolean(process.env.FACEBOOK_APP_ID) &&
  Boolean(process.env.FACEBOOK_APP_SECRET);
const parsedPort = Number.parseInt(process.env.PORT, 10);
const PORT = Number.isFinite(parsedPort) ? parsedPort : 3000;
const dbUrl =
  process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";
const sessionSecret = process.env.SESSION_SECRET || "dev-session-secret";

if (!process.env.ATLASDB_URL) {
  console.warn("ATLASDB_URL not set. Falling back to local MongoDB.");
}

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET not set. Using development fallback secret.");
}

if (process.env.EMAILJS_PUBLIC_KEY) {
  emailjs.init(process.env.EMAILJS_PUBLIC_KEY);
}

async function main() {
  await mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 10000,
  });
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/init", express.static(path.join(__dirname, "init")));

const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  next();
});

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.welcomeMessage = null;
  res.locals.showWelcomeMessage = false;

  if (req.session.welcomeMessage) {
    res.locals.welcomeMessage = req.session.welcomeMessage;
    res.locals.showWelcomeMessage = true;
    delete req.session.welcomeMessage;
    delete req.session.welcomeMessageShown;
  }

  res.locals.currUser = req.user || null;
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/", (req, res) => {
  res.redirect("/listings/home");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    mongoState: mongoose.connection.readyState,
  });
});

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(204).end();
});

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.use(userRouter);
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/auth", authRouter);

app.get("/verify-otp", (req, res) => {
  const { email, reset } = req.query;

  if (!email) {
    req.flash("error", "Email is required for OTP verification");
    return res.redirect("/login");
  }

  res.render("users/verify-otp", {
    email,
    isPasswordReset: reset === "true",
  });
});

app.get("/forgot-password", (req, res) => {
  res.render("users/forgot-password");
});

app.get("/reset-password", (req, res) => {
  const { token } = req.query;

  if (!token) {
    req.flash("error", "Invalid or expired reset link");
    return res.redirect("/forgot-password");
  }

  res.render("users/reset-password", { token });
});

if (process.env.NODE_ENV !== "production") {
  app.get("/create-SKN-ACKOMMODATION-user", async (req, res) => {
    try {
      const newUser = new User({
        email: "team@SKN-ACKOMMODATION.com",
        username: "Team SKN-ACKOMMODATION",
        bio: "We're the SKN-ACKOMMODATION team, powering seamless stays and unique spaces.",
        image: {
          url: "https://cdn.pixabay.com/photo/2018/11/13/22/01/avatar-3814081_1280.png",
          filename: "default-avatar",
        },
        coverImage: {
          url: "https://res.cloudinary.com/dxqjlxgsh/image/upload/v1703420360/SKN-ACKOMMODATION/default-cover_kxn8dr.jpg",
          filename: "default-cover",
        },
      });

      const registeredUser = await User.register(
        newUser,
        process.env.SEED_USER_PASSWORD || "SKN-ACKOMMODATION123",
      );

      res.send(`Created user 'Team SKN-ACKOMMODATION' with ID: ${registeredUser._id}`);
    } catch (err) {
      console.error("Error creating Team SKN-ACKOMMODATION user:", err);
      res.status(500).send("Could not create Team SKN-ACKOMMODATION user.");
    }
  });

  app.get("/seed", async (req, res) => {
    try {
      const ownerId = process.env.SEED_OWNER_ID || "6862f0a5e13ae10af456daa7";
      await Listing.deleteMany({});

      const listings = initData.data.map((obj) => ({
        ...obj,
        owner: ownerId,
      }));

      await Listing.insertMany(listings);
      res.send("Database seeded with sample listings.");
    } catch (err) {
      console.error("Error seeding database:", err);
      res.status(500).send("Seeding failed.");
    }
  });

  app.get("/delete-seed", async (req, res) => {
    try {
      await Listing.deleteMany({});
      res.send("All seeded listings deleted.");
    } catch (err) {
      console.error("Error deleting listings:", err);
      res.status(500).send("Failed to delete listings.");
    }
  });
}

if (hasGoogleOAuth) {
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
} else {
  app.get("/auth/google", (req, res) => {
    req.flash("error", "Google login is not configured right now.");
    res.redirect("/login");
  });

  app.get("/auth/google/callback", (req, res) => {
    req.flash("error", "Google login is not configured right now.");
    res.redirect("/login");
  });
}

if (hasFacebookOAuth) {
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
} else {
  app.get("/auth/facebook", (req, res) => {
    req.flash("error", "Facebook login is not configured right now.");
    res.redirect("/login");
  });

  app.get("/auth/facebook/callback", (req, res) => {
    req.flash("error", "Facebook login is not configured right now.");
    res.redirect("/login");
  });
}

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  console.error(err);
  res.status(statusCode).render("error.ejs", { message });
});

async function startServer() {
  try {
    await main();
    console.log("DB working fine");
    app.listen(PORT, () => {
      console.log(`Listening at port: ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
