import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';


const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send("hello Smith");
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});