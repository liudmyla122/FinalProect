const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || !uri.trim()) {
    console.error('❌ MONGO_URI не задан. Создайте файл .env в папке backend с содержимым: MONGO_URI=mongodb://localhost:27017/instagram');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    console.error('   Проверьте: 1) запущен ли MongoDB, 2) верный ли MONGO_URI в .env');
    process.exit(1);
  }
};

module.exports = connectDB;
