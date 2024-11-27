const mongoose = require("mongoose");
const sampleData = require("./sampleData.js");
const userSchema = require("../models/schema.js");

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/NexusChat");
}

const initUserData = async function () {
  // await userSchema.deleteMany({});
  // console.log("deleted sample user data");
  await userSchema.insertMany(sampleData.data);
  console.log("Inserted sample user data");
};

initUserData();
