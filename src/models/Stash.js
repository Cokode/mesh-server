import mongoose from "mongoose";

const image = new mongoose.Schema({
  assetId: String,
  base64: String,
  duration: String,
  exif: String,
  fileName: String,
  fileSize: Number,
  height: Number,
  type: String,
  uri: String,
  pictureUrls: String,
  width: Number,
  canceled: false
});


const item = new mongoose.Schema({
  rewardEligibility: false, //
  dateAdded: String, //
  itemName: {
    type: String,
    required: true
  }, //

  sp_Number: { //
    type: String,
    required: false
  },

  ifOthers: String, //
  itemDesc: String, //
  barcodeNumber: String, //

  category: {
    type: String,
    enum: [
      'Electronics',
      'Vehicles',
      'Clothing',
      'Accessories',
      // 'Home Appliances',
      'Pets',
      'Others',
    ],
    default: null,
  }, //

  pictures: [image], //

  LostStatus: { //
    type: Boolean,
    default: false
  },

  FoundStatus: { //
    type: Boolean,
    default: null
  },

  timeAdded: String, //
  priorityStatus: String, //
  tagNumber: String, //
  lost_comment: String
});

const stashSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    default: "My Stash"
  },
  registeredItems: [item], // Array of item schemas
  lostItems: [item],       // Array of item schemas
  foundItems: [item],      // Array of item schemas
});

mongoose.model('Stash', stashSchema);



