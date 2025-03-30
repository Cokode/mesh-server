import mongoose from "mongoose";
import jwt from "jsonwebtoken";
const User = mongoose.model('User');
import dotenv from "dotenv"; // maybe remove


const requireAuth = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    console.log("authorization failed ....")
    return res.status(401).send({error : 'you must be logged in.'});
  }

  const token = authorization.replace('Bearer ', '');

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) {
      console.log("Token failed ....")
      console.log("error here in server");
      return res.status(401).send({error: 'you must be logged in'});
    }
    
    const { email } = payload; // extracted  user email from the jwt given
    const user = await User.findOne({ email });

    console.log("User after confirming token: \n", user);

    req.user = user;

    next();
  });
};
export default requireAuth;
