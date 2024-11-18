import "./src/models/User.js"
import "./src/models/Stash.js"; 
import "./src/models/UserBoard.js";
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from "dotenv";
import authRoutes from "./src/routes/authRoutes.js";
import stashRoutes from "./src/routes/stashRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";

const app = express();

app.use(bodyParser.json());
app.use(authRoutes);
app.use(stashRoutes);
app.use(profileRoutes);
dotenv.config();

mongoose.set("strictQuery", true);

async function connectToDatabase() {
  const connectionString = process.env.MONGO_URI;

  try {
        await mongoose.connect(connectionString, { // Todo: remove await
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB successfully");
  } catch (error) {
      console.error("Error connecting to MongoDB:", error);
  }
}

connectToDatabase();

app.get('/', (req, res) => {
  res.send("hello Smith");
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});