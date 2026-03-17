//yeh folder se hum database ko initialize krenge aur even aage agr kbhi hume databse khali krke dobara data se reinitialize krna hua tb bhi hum issi se hi krenge
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

let mongo_url = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("DB working fine");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(mongo_url);
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "680be7383ee92c495b309c8e",
  })); //adding owner
  await Listing.insertMany(initData.data);
  console.log("data was iniialized");
};

initDB();
