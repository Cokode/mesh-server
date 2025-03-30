import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
const User = mongoose.model('User');

const router = express.Router();

router.post('/register', async (req, res) => {  // Register a new user
  const { firstName, lastName, email, username, password } = req.body;
  console.log(req.body)

  // console.log(`Origin: ${req.headers.origin}`);

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    
    if (existingUser) {
      console.log(existingUser + " this is existing user")
      return res.status(400).json({ error: 'Email or username already exists.' });
    }
    const newUser = new User({
      firstName,
      lastName,
      email,
      username,
      password,
    });

    await newUser.save();

   
    res.status(201).json({  // Respond with success 
      message: 'User account created successfully!',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        username: newUser.username,
      },
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);     // Compare passwords
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
       
    // Generate a JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email }, // Payload
      JWT_SECRET, // Secret key
      { expiresIn: '7d' } // Token expiration time
    );

    res.status(200).json({       // If login is successful
      message: 'Login successful!',
      token,
      user: { 
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

export default router;