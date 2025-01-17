import mongoose from "mongoose";


const lostDB = new mongoose.Schema({
  missing: [],      // Array of item schemas
});

mongoose.model('Reports', lostDB);