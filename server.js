// 可将环境变量从 .env 文件加载到 process.env 中
const dotenv = require('dotenv');

// 配置 dotenv，注意 path 是从项目入口文件所在目录作为根目录寻找 env 文件，
dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');
const app = require('./app');

// 用于检测 uncaughtException
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

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`App runing on port ${PORT}`);
});

// 用于检测 unhandledRejection
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION 💥 Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
