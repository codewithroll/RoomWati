const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const User = require("./models/user");
const hasGoogleOAuth =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);
const hasFacebookOAuth =
  Boolean(process.env.FACEBOOK_APP_ID) &&
  Boolean(process.env.FACEBOOK_APP_SECRET);

async function generateUniqueUsername(baseName) {
  const normalizedBase =
    (baseName || "user").replace(/\s+/g, "").toLowerCase() || "user";
  let username = normalizedBase;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${normalizedBase}${counter}`;
    counter += 1;
  }

  return username;
}

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
if (hasGoogleOAuth) {
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
            username: await generateUniqueUsername(profile.displayName),
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
} else {
  console.warn(
    "Google OAuth disabled: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.",
  );
}

// =====================
// 📘 FACEBOOK STRATEGY
// =====================
if (hasFacebookOAuth) {
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
            username: await generateUniqueUsername(profile.displayName),
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
} else {
  console.warn(
    "Facebook OAuth disabled: set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to enable it.",
  );
}
