import express from 'express';
import mongoose from 'mongoose';
// import { BSON}  from 'BSON';
import { BSON } from 'mongodb';
import requireAuth from '../middlewares/requireAuth.js';
import { isReportExist, deleteItem } from '../utils/isReported.js';
import { saveImage } from '../utils/saveImage.js';
import { barcodeGenerator } from '../utils/barcodeGenerator.js';

const Stash = mongoose.model('Stash');
const Reports = mongoose.model('Reports');
const User = mongoose.model('User');
const UserBoard = mongoose.model('UserBoard');
const router = express.Router();

  
// Route to add/save Stash to database.
router.post('/api/addstash', requireAuth, async (req, res) => {
  const form = req.body;

  console.log(form)

  let loop = true;
  let barCode, index = "";
  let id = req.user._id.toString();

  try {
    const userBoard = await UserBoard.findOne({ userId: id });
    let stash = await Stash.findOne({ userId: id});

    let dup = -1;
    let dup1 = -1;
    let stashCopy = null;
    let awsImageURL = "";

    if (stash) { 
      // Search for duplicate
      // if exist stores the index in variable dup.
      if (form.category !== "Others") {
        stashCopy = stash.registeredItems;
        dup = stashCopy.findIndex((e) => (e.sp_Number === form.sp_Number));
        dup1 = stashCopy.findIndex((e) => (e.tagNumber === form.tagNumber && form.tagNumber !== ""));

        if (dup >= 0 || dup1 >= 0) {
          console.log("Here.... Dup ", dup, " dup1:", dup1);
          return res.status(406).send({message: "Duplicate found. cannot add."});
        }
      }

      /*Ensures a barcode number is not used 
      twice.
      */
      while(loop) {
        barCode = barcodeGenerator();
        console.log("Barcode: ", barCode);
        index = stash.registeredItems.findIndex(e => e.barcodeNumber == barCode);
        console.log("Index: ", index);
        if (index < 0 || index == -1) loop = false;
      };

      form.barcodeNumber = barCode;

      /* Save image to AWS S3, extract the imagae s3 
      */
      for (let i = 0; i < form.pictures.length; i++) {
        awsImageURL = await saveImage(form.pictures[i].base64);
        form.pictures[i].base64 = "",
        form.pictures[i].pictureUrls = awsImageURL;
        console.log(form.pictures[i].base64);
        console.log(form.pictures[i].pictureUrls);
      }

      console.log(awsImageURL, " : ", form);
      stash.registeredItems.push(form);
    } else {

      for (let i = 0; i < form.pictures.length; i++) {
        awsImageURL = await saveImage(form.pictures[i].base64);
        form.pictures[i].base64 = "",
        form.pictures[i].pictureUrls = awsImageURL;
        console.log(form.pictures[i].base64);
        console.log(form.pictures[i].pictureUrls);
      }

      stash = new Stash();
      stash.registeredItems.push(form);
      stash.userId = id;
    }

    stash.markModified('registeredItems');
    userBoard.registeredStash += 1;
    // Save new form to database.
    await stash.save();
    await userBoard.save();

    res.status(201).send({ message: "Successfully added stash", barCodeNum: barCode });
  } catch (error) {
    console.error("Error adding stash:", error); // Log the actual error
    res.status(422).send({ error: "Could not add stash" });
  }
});

// Route to get all stash
router.get('/getItems', requireAuth, async (req, res) => {
  try {
    console.log("I am in StashRoute....")
    console.log("IN Server...");
    const stash = await Stash.findOne({ userId: req.user._id });

    if (!stash || stash?.registeredItems.length === 0) {
      return res.status(404).send({ error: 'No items found for you.' });
    }

    res.status(200).send(stash.registeredItems);
  } catch (err) {
    console.error("Error in /getItems:", err);
    res.status(500).send({ error: 'Invalid request' });
  }
});

// This route is used to send lost item report, 
// it will receive a comment/ descreption for the lost item
// then add the item to lost item database.
// This is the case where-by the user reporting is the one who 
// lost the item.or the owner of the item.
router.post('/loadReport', requireAuth, async (req, res) => {
  const { comment, id } = req.body;

  // Validate required fields
  if (!comment || !id) {
    return res.status(400).send({ error: "Bad Request: Missing required fields." });
  }

  console.log(req.body);

  const userId = req.user._id.toString();

  try {
    const reports = await Reports.findOne({ "_id": process.env.REPORTBANK });
    const userBoards = await UserBoard.findOne({ userId });

    // Check required resources
    if (!reports || !userBoards) {
      return res.status(500).send({ error: "Internal Server Error: Missing required resources." });
    }

    // Check if report already exists
    if (isReportExist(reports.missing, id)) {
      return res.status(406).send({ response: "Item has already been reported" });
    }

    // Retrieve stash
    const stash = await Stash.findOne({ userId: req.user._id });

    if (stash) {
      // Find the lost stash item
      const lostStash = stash.registeredItems.find((element) => element._id.toString() === id);

      if (!lostStash) {
        return res.status(404).send({ message: "Cannot find stash item" });
      }

      // Update lost items
      stash.lostItems.push(lostStash);
      stash.markModified('lostItems');

      // Remove from registered items
      stash.registeredItems = stash.registeredItems.filter((e) => e._id.toString() !== id);
      stash.markModified('registeredItems');

      // Update lost stash details
      lostStash.LostStatus = true;
      lostStash.priorityStatus = "Very important";
      lostStash.lost_comment = comment;
      lostStash.date_reported = new Date().toDateString();
      lostStash.ownerID = req.user._id;

      const itemOwner = req.user;
      itemOwner.password = "";
      itemOwner.address = "";
      itemOwner.email = "";
      itemOwner.reportID = req.user._id;

      lostStash.ownerInfo = itemOwner;

      // Update user boards
      userBoards.lostStash += 1;
      await userBoards.save();

      // Update reports
      reports.missing.push(lostStash);
      reports.markModified('missing');
      await reports.save();

      // Save stash
      await stash.save();

      return res.status(201).send({
        message: "Report submitted successfully",
        reported_item: lostStash,
      });
    } else {
      return res.status(404).send({ message: "Stash not found for the user" });
    }
  } catch (error) {
    console.error("Error during report submission.", error);
    return res.status(500).send({ message: "An error occurred", error });
  }
});


router.delete('/delete', async (req, res) => {

  console.log("Inside delete route");

  // const reports = await Reports.findOne({"_id": process.env.REPORTBANK});

  // console.log(reports.missing[0]?.lost_comment);

  // const newSet = deleteItem( "678642f156ef66d95c8c7156", reports.missing)

  // reports.missing = newSet;
  // console.log(newSet?.lost_comment);
  // await reports.save();
  res.send("sucessful deleted.");

})

router.get('/getUser', requireAuth, async (req, res) => {
  const  itemOwner = req.user;

 
  itemOwner.password = "";
  
  return res.status(201).send({itemOwner});
});


/*  Optimization Suggestion:

  Update the Reports schema so that each user has an object 
  containing an array of their lost items (stash). 

  This way, instead of iterating through all lost items to find a specific one, 
  we can simply locate the user object, which holds all lost stash entries for that user.
*/
router.post('/update_pro', requireAuth, async (req, res) => {

  const id = req.user._id;
  let existingUser = await User.findById({_id: id});
  const reports= await Reports.findOne({ _id: process.env.REPORTBANK });

  if (!existingUser) {
    return res.status(404).send({message: "invalid Request"});
  }

  const { img } = req.body;
  let imageUrl =  await saveImage(img);
  existingUser.profilePicture = imageUrl;


  if ( reports ) {
    let missing = reports.missing;

    // Update user profile picture in lost stash
    missing.forEach(element => { 
      if (element.ownerInfo._id.toString() == id) {
        element.ownerInfo.profilePicture = imageUrl;
      }}
    );
  
    reports.missing = missing;
    reports.markModified('missing'); //Inform mongoogse of modification made
  
    await reports.save();
  }
  
  await existingUser.save();
  return res.status(200).send({ message: "success." });

});

router.get('/boardData', requireAuth, async (req, res) => {
  //const { id } = req.user._id;

  console.log(req.user);

  try {

    let id = req.user._id.toString();

    const userBoards = await UserBoard.findOne({userId: id});

    if (!userBoards){
      console.log("error can't find");
      return;
    }
    
    return res.status(200).send({data : userBoards});
  } catch (error) {
    console.log("Error fetching data: ", error);
  }
  
})

// Dommy Route to reset hashed passwords. 
// Remember to remove the line in schema 
// that checks if password changed
router.post('/pass', async (req, res) => {
  const {email} = req.body;

  const user = await User.findOne({ email });

  user.password = "one"

  await user.save();

  res.status(200).send({message: "Yes! DONE"});

})

router.post("/delete-stash", requireAuth, async (req, res) => {
  const { id } = req.body;

  console.log(req.user);
  let userID = req.user._id.toString();
 
  if (!id) {
    return res.status(400).json({ error: "Stash ID is required" });
  }

  try {
    // Find the stash that contains the item
    const stash = await Stash.findOne({ userId: userID });
    const userBoard = await UserBoard.findOne({userId: userID});

    if (!stash || !userBoard) {
      return res.status(404).json({ error: "Stash not found" });
    }

    // Filter out the item to be deleted
    stash.registeredItems = stash.registeredItems.filter(
      (item) => item._id.toString() !== id
    );

    userBoard.registeredStash -= 1;

    stash.markModified('registeredItems')
    await stash.save();
    await userBoard.save();

    res.status(200).json({ message: "Stash item deleted successfully" });
  } catch (error) {
    console.error("Delete Stash Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
