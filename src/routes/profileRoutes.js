import { Router } from "express";
import { mongoose } from "mongoose";
const User = mongoose.model('User');
const Reports = mongoose.model('Reports');
const UserBoard = mongoose.model('UserBoard');
import requireAuth from "../middlewares/requireAuth.js";
import bcrypt from "bcrypt";

const router = Router();

router.put('/update-profile', requireAuth, async(req, res) => {
  const updates = req.body; // Other fields to be updated
  const id = req.user._id.toString();

  try {
    const updatedUser = await User.findByIdAndUpdate(id, updates, { // Update user fields based on the provided data
      new: true, // Return the updated document
       runValidators: true, // Ensure validation rules are applied
    }); 
 
    // const lostStash = await Reports.findOneAndUpdate({filer}, {update});
    const reports = await Reports.findOne({ "_id" : process.env.REPORTBANK });

    reports?.missing.forEach(element => {

      if (element.ownerInfo._id.toString() == id) {
        element.ownerInfo = {
          ...element.ownerInfo,
          ...updates
        };
      }

    });

    if (!updatedUser) {
      console.log(" I can't update this user");
        return res.status(404).send({ error: 'User not found.' });
    }

    reports.markModified('missing');
    await reports.save();

    return res.status(201).send({ // Respond with success
      message: 'Profile updated successfully!',
     // user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
});


router.post('/updateBoard', requireAuth, async (req, res) => {
  const { id, num, owner, itemName} = req.body;

  try {
    const userBoards = await UserBoard.findOne({userId: owner});

    if (!userBoards) {
      return res.status(500).json({ error: 'Internal Server Error.' });
    }

    let missingStash = {
      stashName: itemName,
      finderID: req.user._id,
      founderName: `${req.user.firstName} ${req.user.lastName}`,
      itemID: id,
      contactInfo: num,
    };

    userBoards.discoveredItems.push(missingStash);

    userBoards.markModified('discoveredItems');
    await userBoards.save();

  } catch (error) {
    console.log("Error finding query.");
  }

  return res.status(200).send({message: "Sucess!"});
});

export default router;