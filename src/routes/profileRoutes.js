import { Router } from "express";
import { mongoose } from "mongoose";
const User = mongoose.model('User');
const Reports = mongoose.model('Reports');
const UserBoard = mongoose.model('UserBoard');
const Stash = mongoose.model('Stash');
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
  const { id, num, owner, itemName } = req.body;

  // Validate required fields
  if (!id || !num || !owner || !itemName) {
    return res.status(400).json({ error: 'Bad Request: Missing required fields.' });
  }

  try {
    const userBoards = await UserBoard.findOne({ userId: owner });
    const ownerStash = await Stash.findOne({ userId: owner });

    // Check if resources exist
    if (!userBoards || !ownerStash) {
      return res.status(500).json({ error: 'Internal Server Error.' });
    }

    console.log(userBoards);

    // Create missing stash object
    const missingStash = {
      stashName: itemName,
      finderID: req.user._id,
      founderName: `${req.user.firstName} ${req.user.lastName}`,
      itemID: id,
      contactInfo: num,
    };

    // Find and move item from lostItems to foundItems
    const lostOne = ownerStash.lostItems.find((e) => e._id.toString() === id);

    if (lostOne) {
      ownerStash.foundItems.push(lostOne); // Move to foundItems
      ownerStash.lostItems = ownerStash.lostItems.filter((e) => e._id.toString() !== id); // Remove from lostItems
      ownerStash.FoundStatus = true;
      ownerStash.markModified('foundItems');
      ownerStash.markModified('lostItems');
    }

    // Update userBoards and ownerStash
    userBoards.foundItems += 1; // Increment found items count
    userBoards.discoveredItems.push(missingStash);
    userBoards.markModified('discoveredItems');

    await ownerStash.save();
    await userBoards.save();

    return res.status(200).json({ message: 'Success!' });
  } catch (error) {
    console.error("Error finding query.", error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
});

/** @Function Documentation
 * @route POST /conclude
 * @desc Conclude a transaction where a found item is confirmed, registered, and removed from the global reports list.
 *       The operation involves multiple database updates, including the user's stash, user boards, and global reports.
 * @access Protected (Requires Authentication)
 *
 * Request Body:
 *  - finderID (string): The ID of the user who found the item.
 *  - itemID (string): The ID of the item being concluded (transferred from 'foundItems' to 'registeredItems').
 *
 * Process Flow:
 *  1. Validate request body to ensure all necessary fields (userID, finderID, itemID) are provided.
 *  2. Fetch required data from the database:
 *     - The requesting user's stash (foundItems and registeredItems lists).
 *     - The requesting user's UserBoard (tracks found items, discovered items, etc.).
 *     - The finder user's UserBoard (to update their reward points).
 *     - The global Reports collection (to remove the item from the reports list).
 *  3. Validate if all required data exists before proceeding with the transaction.
 *  4. Identify the item within the user's stash and move it from 'foundItems' to 'registeredItems'.
 *  5. Remove the item from the global reports list by filtering it out from the 'missing' array.
 *  6. Update UserBoard statistics:
 *     - Decrease 'foundItems' and 'lostStash' counters for the requesting user.
 *     - Remove the item from the user's 'discoveredItems' list.
 *     - Reward the finder user by increasing their 'rewardPoints'.
 *  7. Persist all changes to the database using asynchronous save operations.
 *  8. Respond with a success message upon successful transaction completion.
 *
 * Potential Errors:
 *  - Missing or invalid request parameters (userID, finderID, itemID).
 *  - Incomplete data from the database (e.g., user stash or user boards not found).
 *  - Item not existing within the user's stash.
 *  - Database save errors.
 *
 * Returns:
 *  - 200 OK: { message: "Successful" }
 *  - 400 Bad Request: { error: "Bad Request: Missing required fields." } or detailed error messages.
 */

router.post('/conclude', requireAuth, async (req, res) => {
  let userID = req.user._id.toString();
  let { finderID, itemID } = req.body;

  console.log("Request Body:", req.body);
  console.log("User ID:", userID);
  console.log("Finder ID:", finderID);
  console.log("Item ID:", itemID);

  if (!userID || !finderID || !itemID) {
    console.error("Invalid data:", {userID, finderID, itemID});
    return res.status(400).send({ error: "Bad Request: Missing required fields." });
  }

  try {
    const [myStash, myUserboard, otherUserBoard, reports] = await Promise.all([
      Stash.findOne({ userId: userID }),
      UserBoard.findOne({ userId: userID }),
      UserBoard.findOne({ userId: finderID }),
      Reports.findOne({ "_id": process.env.REPORTBANK })
    ]);

    if (!myStash || !myUserboard || !otherUserBoard || !reports) {
      return res.status(400).send({ error: "Bad Request: Invalid data." });
    }

    let stash = myStash.foundItems.find((e) => e._id.toString() === itemID);
    if (!stash) {
      return res.status(404).send({ error: "Item not found in your stash." });
    }

    // Remove from foundItems and add to registeredItems
    myStash.foundItems = myStash.foundItems.filter((e) => e._id.toString() !== itemID);
    myStash.registeredItems.push(stash);

    // Remove from reports
    reports.missing = reports.missing.filter((e) => e._id.toString() !== itemID);

    // Update User Boards
    myUserboard.foundItems -= 1;
    myUserboard.lostStash -= 1;
    myUserboard.discoveredItems = myUserboard.discoveredItems.filter((e) => e.itemID !== itemID);

    otherUserBoard.rewardPoints += 100;

    // Mark modified fields
    myStash.markModified('registeredItems');
    myStash.markModified('foundItems');
    reports.markModified('missing');
    myUserboard.markModified('discoveredItems');

    await Promise.all([
      myStash.save(),
      myUserboard.save(),
      otherUserBoard.save(),
      reports.save()
    ]);

    return res.status(200).send({ message: "Successful" });

  } catch (error) {
    console.error(error);
    return res.status(400).send({ errMessage: "Bad Request:", error });
  }
});

export default router;