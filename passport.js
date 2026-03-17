const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const User = require("./models/user");

// =====================
// 🔐 SERIALIZE / DESERIALIZE
// =====================
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// =====================
// 🌐 GOOGLE STRATEGY
// =====================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let existingUser = await User.findOne({
          googleId: profile.id,
        });

        if (existingUser) {
          return done(null, existingUser);
        }

        // create new user
        const newUser = new User({
          username: profile.displayName.replace(/\s+/g, "").toLowerCase(),
          email: profile.emails ? profile.emails[0].value : undefined,
          googleId: profile.id,
          image: {
            url: profile.photos ? profile.photos[0].value : undefined,
          },
        });

        const savedUser = await newUser.save();
        done(null, savedUser);
      } catch (err) {
        done(err, null);
      }
    },
  ),
);

// =====================
// 📘 FACEBOOK STRATEGY
// =====================
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/auth/facebook/callback",
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let existingUser = await User.findOne({
          facebookId: profile.id,
        });

        if (existingUser) {
          return done(null, existingUser);
        }

        const newUser = new User({
          username: profile.displayName.replace(/\s+/g, "").toLowerCase(),
          email: profile.emails ? profile.emails[0].value : undefined,
          facebookId: profile.id,
          image: {
            url: profile.photos ? profile.photos[0].value : undefined,
          },
        });

        const savedUser = await newUser.save();
        done(null, savedUser);
      } catch (err) {
        done(err, null);
      }
    },
  ),
);
