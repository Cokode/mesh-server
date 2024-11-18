import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
      type: String,
      required: true,
  },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
  },
  verificationStatus: {
    type: String,
    default: 'Not verified'  
  },
})

userSchema.pre('save', async function (next) {  // **Salting and Hashing Password Before Save**
  if (!this.isModified('password')) return next(); // Skip if the password is not modified

  const saltRounds = 10; // Define the cost of hashing
  const salt = await bcrypt.genSalt(saltRounds); // Generate a unique salt
  this.password = await bcrypt.hash(this.password, salt); // Hash the password with the salt
  next();
});

// **Method to Compare Passwords**
userSchema.methods.comparePassword = async function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password); // Compares input with hashed password
};
 
mongoose.model("User", userSchema);