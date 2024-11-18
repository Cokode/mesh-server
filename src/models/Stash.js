import mongoose from "mongoose";

const item = new mongoose.Schema({
  itemName: String,
  category: {
    type: String,
    enum: [
      'Electronics',
      'Vehicles',
      'furniture',
      'Clothing/Accessories',
      'Home Appliances',
      'Pets',
      'Others',
    ],
    default: null,
  },
  itemDesc: String,
  barcodeNumber: String,
  picture: {
    type: String,
    default: null,
  },
  serialNumber: String,
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



