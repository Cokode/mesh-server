import express from 'express';
import mongoose from 'mongoose';
import requireAuth from '../middlewares/requireAuth.js';

const Stash = mongoose.model('Stash');
const router = express.Router();

router.post('/api/addstash', requireAuth, async (req, res) => {
  const form = req.body;

  try {
    //console.log(form);

    // Find the stash for the current user
    let stash = await Stash.findOne({ userId: req.user._id });

    if (stash) { // CONTINUE LATER / ENSURE NO DUPLICATE

      stash.registeredItems.push(form);
    } else {
      // Create a new stash if it doesn't exist
      stash = new Stash({ registeredItems: [form], userId: req.user._id });
    }

    // Save the stash (whether updated or new)
    await stash.save();

    res.status(201).send({ message: "Successfully added stash" });
  } catch (error) {
    console.error("Error adding stash:", error); // Log the actual error
    res.status(422).send({ error: "Could not add stash" });
  }
});



router.get('/getItems', requireAuth, async (req, res) => {
  try {
    console.log("IN Server...");
    const stash = await Stash.findOne({ userId: req.user._id });

    if (!stash || stash.registeredItems.length === 0) {
      return res.status(404).send({ error: 'No items found for you.' });
    }

    console.log("Returning items..." + stash.registeredItems.length);
    res.status(200).send(stash.registeredItems);
  } catch (err) {
    console.error("Error in /getItems:", err);
    res.status(500).send({ error: 'Invalid request' });
  }
});

export default router;
