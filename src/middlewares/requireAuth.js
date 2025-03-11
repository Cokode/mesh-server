import mongoose from "mongoose";
import jwt from "jsonwebtoken";
const User = mongoose.model('User');
import dotenv from "dotenv"; // maybe remove


const requireAuth = (req, res, next) => {
  const { authorization } = req.headers;

  console.log("I am in authorization...." + authorization)

  if (!authorization) {
    console.log("authorization failed ....")
    return res.status(401).send({error : 'you must be logged in.'});
  }

  const token = authorization.replace('Bearer ', '');

  console.log(token)

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) {
      console.log("Token failed ....")
      console.log("error here in server");
      return res.status(401).send({error: 'you must be logged in'});
    }
    
    const { userId } = payload;  // extracted  user ID from the jwt given
    const user = await User.findById(userId);
    req.user = user;
    console.log("USER: " + user);

    next();
  });
};
export default requireAuth;
