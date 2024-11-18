import express from 'express';
import mongoose from 'mongoose';
import requireAuth from '../middlewares/requireAuth.js';

const Stash = mongoose.model('Stash');
const router = express.Router();

router.post('/api/addstash', requireAuth, async (req, res) => {
  const { registeredItems } = req.body;
  try {
    let stash = await Stash.findOne({ userId: req.user._id });

    if (stash) {
      stash.registeredItems.push(...registeredItems);
      await stash.save();
    } else {
      stash = new Stash({ registeredItems, userId: req.user._id });
      await stash.save();
    }

    res.status(201).send(stash);
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
});

router.get('/getitems', requireAuth, async (req, res) => {
  try {
    const items = await Stash.findOne({userId: req.user._id});
    
    if(!items) {
      res.status(422).send({error: 'no items for you'});
    }

    res.send(items);
  } catch (err) {
    res.status(422).send({error: 'invalid request'});
  }
})

export default router;