import "./src/models/User.js";
import "./src/models/Stash.js";
import "./src/models/UserBoard.js";
import "./src/models/LostDB.js"
import express from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./src/routes/authRoutes.js";
import stashRoutes from "./src/routes/stashRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import validSRN from "./src/routes/validSRN.js";
import getReport from "./src/routes/getReports.js"

dotenv.config();

const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json({ limit: '10000mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware for CORS
app.use(cors());

// Debugging middleware (remove later)
app.use((req, res, next) => {
  //console.log(`Request Body Index : ${JSON.stringify(req.body)}`);
  next();
});

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', "*"); // Replace with your frontend URL
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  next();
});

// Routes
app.use(authRoutes);
app.use(stashRoutes);
app.use(profileRoutes);
app.use(validSRN);
app.use(getReport);

// MongoDB Connection
mongoose.set("strictQuery", true);

async function connectToDatabase() {
  const connectionString = process.env.MONGO_URI;

  try {
    mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDatabase();

// Root Route
app.get('/', (req, res) => {
  res.send("hello Smith");
});

// Start Server
app.listen(3000, () => {
  console.log("listening on port 3000");
});
