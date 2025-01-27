import express from 'express';
import mongoose from 'mongoose';
import requireAuth from '../middlewares/requireAuth.js';
import isReportExist from '../utils/isReported.js';

const Stash = mongoose.model('Stash');
const Reports = mongoose.model('Reports');
const router = express.Router();

router.post('/api/addstash', requireAuth, async (req, res) => {
  const form = req.body;

  try {
    let stash = await Stash.findOne({ userId: req.user._id });

    if (stash) { 

      stash.registeredItems.push(form);
    } else {
      stash = new Stash({ registeredItems: [form], userId: req.user._id });
    }

    await stash.save();

    res.status(201).send({ message: "Successfully added stash" });
  } catch (error) {
    console.error("Error adding stash:", error); // Log the actual error
    res.status(422).send({ error: "Could not add stash" });
  }
});

router.get('/getItems', requireAuth, async (req, res) => {
  try {
    console.log("I am in StashRoute....")
    console.log("IN Server...");
    const stash = await Stash.findOne({ userId: req.user._id });

    if (!stash || stash.registeredItems.length === 0) {
      return res.status(404).send({ error: 'No items found for you.' });
    }

    console.log(stash.registeredItems[0]._id);

    console.log("Returning items..." + stash.registeredItems.length);
    res.status(200).send(stash.registeredItems);
  } catch (err) {
    console.error("Error in /getItems:", err);
    res.status(500).send({ error: 'Invalid request' });
  }
});


router.post('/reportStash', requireAuth, async (req, res) => {
  const {lost_comment} = req.body;

  try {

    const reports = await Reports.findOne({"_id": "67865d76db0f34e1140b7193"})

    if (reports) {
      reports.missing.push(lost_comment);
      console.log('found what we are looking for: ' + reports);
      reports.save();

      res.status(201).send("Hey, we added it!");

    } else {
      res.status(404).send("Hey, we did not find it!");
    }

  } catch (error) {
    console.log(error);
  }
})

router.post('/loadReport', requireAuth, async (req, res) => {
  const { comment, id } = req.body;
  console.log(req.body);

  try {

    const reports = await Reports.findOne({"_id": process.env.REPORTBANK})

    if (isReportExist(reports.missing, id)){
      res.status(406).send({response: "Item already has been reproted"});
      console.log("Oops! item already exist.")
      return;
    }

    let stash = await Stash.findOne({ userId: req.user._id });

    if (stash) {
      let lostStash = stash.registeredItems.find(element => element._id == id);

      if (!lostStash) {
        return res.status(404).send({ message: "Cannot find stash item" });
      }

      lostStash.LostStatus = true;
      lostStash.priorityStatus = "Very important";
      lostStash.lost_comment = comment;
      lostStash.date_reported = new Date().toISOString();
      
      await reports.missing.push(lostStash);
      reports.save();

      return res.status(201).send({
        message: "Report submitted successfully",
        updatedItem: lostStash,
      });
    } else {
      return res.status(404).send({ message: "Stash not found for the user" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "An error occurred", error });
  }
});


export default router;
