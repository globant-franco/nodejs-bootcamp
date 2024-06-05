// Order matters here, so dotenv is available everywhere
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

const mongoose = require('mongoose');
const DB_STRING = process.env.DATABASE.replace(
  '<DATABASE_PASSWORD>',
  process.env.DATABASE_PASSWORD
);

const tours = fs.readFileSync(`${__dirname}/tours.json`, 'utf8');
const reviews = fs.readFileSync(`${__dirname}/reviews.json`, 'utf8');
const users = fs.readFileSync(`${__dirname}/users.json`, 'utf8');

mongoose
  .connect(DB_STRING, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const importData = async () => {
  try {
    await Tour.create(JSON.parse(tours));
    // Comment out the passwordConfirm validation
    // and the encryption password middleware before importing users
    // to skip these validations
    await User.create(JSON.parse(users, { validateBeforeSave: false }));
    await Review.create(JSON.parse(reviews));

    console.log('Tours, Users, Reviews data successfully loaded!');
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};

// DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('Tours, Users, Reviews data successfully deleted!');
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
