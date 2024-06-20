// Order matters here, so dotenv is available everywhere
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// Catch uncaught exceptions, bugs that happen in our synchronous code
// Order of how we listen to events is important, if we put console.log(foo)
// above then the error won't be caught
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION 💥 Shutting down...');
  console.log(err);
  process.exit(1); // 0 stands for success, 1 stands for failure
});

//console.log(foo);

const app = require('./app');
const port = process.env.PORT;
const mongoose = require('mongoose');
const DB_STRING = process.env.DATABASE.replace(
  '<DATABASE_PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB_STRING, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//unhandled promise rejections error, like DB down, or errors
// outside express or mongoose
// This is to globally handle these errors
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  // Shut down gracefully the server, then we shut down the application
  server.close(() => {
    process.exit(1); // 0 stands for success, 1 stands for failure
  });
});

// SIGTERM is a request to the program to terminate.
// Listen to this event in case our cloud provider sends us a SIGTERM
process.on('SIGTERM', (err) => {
  console.log('SIGTERM RECEIVED! Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0); // 0 stands for success, 1 stands for failure
  });
});
