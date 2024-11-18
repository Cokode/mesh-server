import mongoose from "mongoose";

const userBoardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rewardPoints: {
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
  }
});

mongoose.model('UserBoard', userBoardSchema);