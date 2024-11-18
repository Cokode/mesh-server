import { Router } from "express";
import { mongoose } from "mongoose";
const User = mongoose.model('User');
import requireAuth from "../middlewares/requireAuth.js";

const router = Router();

router.put('/update-profile', requireAuth, async(req, res) => {
  const { userId } = req.body; // Assume user ID is passed in the request body
  const updates = req.body; // Other fields to be updated

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updates, { // Update user fields based on the provided data
      new: true, // Return the updated document
      runValidators: true, // Ensure validation rules are applied
    });

    if (!updatedUser) {
      console.log(" I can't update this user");
        return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ // Respond with success
      message: 'Profile updated successfully!',
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

export default router;