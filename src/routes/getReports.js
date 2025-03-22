import express from 'express';
import mongoose from 'mongoose';
import requireAuth from '../middlewares/requireAuth.js';


const Reports = mongoose.model('Reports');
const router = express.Router();

router.get("/getReport",  requireAuth, async(req, res) => {

  console.log(req.headers);

  // the id must be hidden in env file
  const reports = await Reports.findOne({"_id": process.env.REPORTBANK})

  if (!reports) {
    res.status(404).send({message: "nothing found."});
  } 
  
  // remove unwanted stash
/* 
  let filtered = reports.missing.filter(e => e.barcodeNumber != "");
  reports.missing = filtered;
  console.log("Filtered: ", filtered);
  await reports.save();
  console.log(reports.missing); */
  res.status(200).send(reports.missing);
});


export default router;