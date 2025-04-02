import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
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
      required: false,
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

userSchema.pre('findOneAndUpdate', async function (next) {

  if (this._update.password) { // Check if password is being updated
    const saltRounds = 10; // Define the cost of hashing
    const salt = await bcrypt.genSalt(saltRounds); // Generate a unique salt
    this._update.password = await bcrypt.hash(this._update.password, salt); // Hash the password
  }
  
  next();
});

// **Method to Compare Passwords**
userSchema.methods.comparePassword = async function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password); // Compares input with hashed password
};
 
mongoose.model("User", userSchema);