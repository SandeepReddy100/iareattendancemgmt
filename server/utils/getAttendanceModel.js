const mongoose = require("mongoose");
const attendanceSchema = require("../models/attendance.model").schema;

const modelCache = {};

async function getAttendanceModel(collectionName) {
  // 🔁 Return cached model if previously loaded
  if (modelCache[collectionName]) {
    return modelCache[collectionName];
  }

  // 🔍 Check if the collection exists in the MongoDB database
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map((col) => col.name);

  if (!collectionNames.includes(collectionName)) {
    throw new Error(`❌ Collection '${collectionName}' does not exist in the database.`);
  }

  // ✅ Reuse existing model if already registered by Mongoose
  if (mongoose.models[collectionName]) {
    modelCache[collectionName] = mongoose.model(collectionName);
  } else {
    // ⚠️ Safe bind: only works if collection exists
    modelCache[collectionName] = mongoose.model(
      collectionName,
      attendanceSchema,
      collectionName
    );
  }

  return modelCache[collectionName];
}
module.exports = getAttendanceModel;
