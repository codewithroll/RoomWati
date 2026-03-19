const Joi = require("joi");
const moment = require("moment");

const booleanLike = Joi.boolean()
  .truthy("true")
  .truthy("on")
  .falsy("false")
  .falsy("off");

// Custom date validation
const customDateValidator = (value, helpers) => {
  if (!value) return value; // If no date is provided, let required() handle it

  // Try to parse the date with moment
  const date = moment(value, moment.ISO_8601, true);
  if (date.isValid()) {
    return date.toDate(); // Convert to JavaScript Date object
  }

  // If we get here, the date is invalid
  return helpers.error("any.invalid");
};

module.exports.ListingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.alternatives()
      .try(
        Joi.number().min(0).required(),
        Joi.string()
          .pattern(/^\d*\.?\d*$/)
          .required(),
      )
      .custom((value, helpers) => {
        // Convert string to number, default to 0 if invalid
        const num = Number(value);
        if (isNaN(num) || num < 0) {
          return helpers.error("any.invalid");
        }
        return num;
      })
      .messages({
        "any.required": "Price is required",
        "number.base": "Price must be a number",
        "number.min": "Price must be 0 or greater",
        "any.invalid": "Please enter a valid price",
      }),
    image: Joi.string().allow("", null),

    country: Joi.string().required(),
    location: Joi.string().required(),

    // Room booking fields
    roomType: Joi.string()
      .valid("single", "shared", "studio", "ensuite")
      .required(),
    furnished: Joi.string()
      .valid("furnished", "unfurnished", "semifurnished")
      .required(),
    genderPreference: Joi.string().valid("male", "female", "any").required(),
    preferredTenants: Joi.string()
      .valid("students", "professionals", "family", "couples", "any")
      .required(),

    immediateAvailability: booleanLike.optional().default(false),
    availableFrom: Joi.alternatives()
      .try(
        Joi.date(),
        Joi.string().custom(customDateValidator, "custom date validation"),
        Joi.any().empty(""),
      )
      .optional()
      .default(moment().toDate())
      .description("The date from which the listing is available"),

    // Nested objects with booleans accepting string equivalents
    amenities: Joi.object({
      attachedBathroom: booleanLike.optional(),
      kitchenAccess: booleanLike.optional(),
      wifi: booleanLike.optional(),
      ac: booleanLike.optional(),
      laundry: booleanLike.optional(),
      parking: booleanLike.optional(),
    }).optional(),

    rules: Joi.object({
      smoking: booleanLike.optional(),
      pets: booleanLike.optional(),
      guests: booleanLike.optional(),
      curfew: booleanLike.optional(),
      curfewDetails: Joi.string().allow("", null).optional(),
    }).optional(),

    securityDeposit: Joi.alternatives()
      .try(
        Joi.number().min(0).default(0),
        Joi.string()
          .pattern(/^\d*$/) // Allow empty string
          .allow("") // Explicitly allow empty string
          .default("0"),
      )
      .optional()
      .default(0)
      .custom((value, helpers) => {
        // Convert string numbers to actual numbers, default to 0 for empty/undefined
        if (value === "" || value === null || value === undefined) {
          return 0;
        }
        const num = Number(value);
        return isNaN(num) ? 0 : Math.max(0, num);
      }),
    minStayMonths: Joi.alternatives()
      .try(
        Joi.number().min(1).default(1),
        Joi.string().pattern(/^\d*$/).allow("").default("1"),
      )
      .optional()
      .default(1)
      .custom((value, helpers) => {
        // Convert string numbers to actual numbers, default to 1 for empty/undefined
        if (value === "" || value === null || value === undefined) {
          return 1;
        }
        const num = Number(value);
        return isNaN(num) ? 1 : Math.max(1, num);
      }),

    bills: Joi.object({
      included: booleanLike.optional(),
      details: Joi.string().allow("", null).optional(),
    }).optional(),
  }).required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
  }).required(),
});
