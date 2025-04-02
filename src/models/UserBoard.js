import mongoose from "mongoose";
const itemSchema = new mongoose.Schema({
  stashName: String,
  finderID: String,
  itemID: String,
  contactInfo: String,
  founderName: String
});

const userBoardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lostStash: {
    type: Number,
    default: 0,
  },
  rewardPoints: {
    type: Number,
    default: 0
  },
  pointsUsed: {
    type: Number,
    default: 0
  },
  foundItems: {
    type: Number,
    default: 0
  },
  accountOpenDate: {
    type: Date,
    default: Date.now()
  },
  AccountStatus: {
    type: String,
    enum: ['Active', 'Suspended', 'Deactivated'],
    default: 'Active'
  },
  discoveredItems: {
    type: [itemSchema], // Use array of subdocuments
  },
  registeredStash: {
    type: Number,
    default: 0
  },
  profilePicture: {
    type: String,
    default: ""
  }
});

mongoose.model('UserBoard', userBoardSchema);