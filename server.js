const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('UNCAUGHT REJECTION 💥 Shutting down...');
  process.exit(1);
});

// CONNECT DB
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose.connect(DB).then(() => {
  console.log('DB connection successful');
});

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`App runing on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION 💥 Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
