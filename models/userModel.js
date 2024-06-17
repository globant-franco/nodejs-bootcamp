const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto'); // node's built-in module

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A User must have a name'],
  },
  email: {
    type: String,
    unique: true,
    lowercase: true, // transform email to lowercase
    validate: [validator.isEmail, 'Please provide a valid email'],
    required: [true, 'A user must have an email'],
  },
  photo: { type: String, default: 'default.jpg' }, // path to the file system
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false, // means exclude this field from the results
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must have a password confirm'],
    select: false,
    validate: {
      // This only works on CREATE! AND .save()
      validator: function (value) {
        console.log('Im validating password confirmation');
        return this.password === value;
      },
      message: 'Password confirmation does not match password',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false, // means exclude this field from the results
  },
});

userSchema.pre('save', async function (next) {
  // This function should only be executed if password changed, not other fields
  if (!this.isModified('password')) return next();
  // bcrypt first salt(add random string) and then hash the password
  // Second parameter is the cost, by default is 10, and this is how much
  // CPU will be used to generate the salt string
  // There is also a sync version of bcrypt.hash
  this.password = await bcryptjs.hash(this.password, 12);

  // Delete the passwordConfirm field, we don't want to persist it
  this.passwordConfirm = undefined;
  next();
});

// This hook is called when for instance the user resets password
// or updates it
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // We substract 1 second because sometimes the token is created
  // after the password is actually changed, making the token issue
  // date AKA JWTTimestamp greater than passwordChangedAt
  // if this happen then the token is marked as invalid
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // `this` points to the current query
  // remember that in arrow functions you don't have access to the `this` keyword
  // Not equal to false will also fetch those documents where
  // the active field is not set yet, or doesn't exist in the DB scheme
  // due to changes in the schema fields
  // so, it will for instance return those with active=undefined
  this.find({ active: { $ne: false } });
  next();
});

// instance method to login user
// candidatePassword is the password we get from the user form
// userPassword is the password we have stored in the database
// remember that by default password is not queried, therefore
// this.password won't return the password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcryptjs.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // passwordChangedAt comes in the format yyyy-mm-ddTHH:mm:ss.SSSZ
  if (this.passwordChangedAt) {
    // getTime returns the time in milliseconds, so we need to convert it
    // to seconds to compare it with JWTTimestamp which comes in seconds
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // if changedTimestamp is greater than the JWTTimestamp it means
    // that the password was changed after the token was issued
    return JWTTimestamp < changedTimestamp;
  }

  return false; // false means user has not changed password
};

userSchema.methods.createPasswordResetToken = function () {
  // generate a random string
  // This resetToken is never stored in the database for security reasons
  // it's only sent to the user and make it available only during a
  // short period of time, once user sends it back we encrypt it
  // and then compare it against the passwordResetToken field
  const resetToken = crypto.randomBytes(32).toString('hex'); // convert to hexadecimal string
  // Token is just a random string
  // Digest is a hashed string
  // sha256 is the algorithm used to hash the resetToken
  // This token is now encrypted so we can then save it in the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 10 minutes * 60 seconds * 1000 milseconds => 10 minutes
  // The token will be valid only for 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
