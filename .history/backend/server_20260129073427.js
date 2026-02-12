const express = require('express');
const connectDB = require('./src/config/db');
require('dotenv').config();

const app = express();

// Подключаемся к MongoDB
connectDB();

// Middleware для работы с JSON (увеличиваем лимит для base64-изображений/видео)
// ВАЖНО: вы отправляете видео в base64, поэтому тело запроса получается очень большим.
// Увеличиваем лимит до 1TB для поддержки очень больших файлов.
app.use(express.json({ limit: '1tb' }));
app.use(express.urlencoded({ extended: true, limit: '1tb' }));

// CORS для работы с фронтендом
app.use(require('cors')());

// Маршруты
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/search', require('./src/routes/searchRoutes'));
app.use('/api/explore', require('./src/routes/exploreRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));

// Обработка ошибок (должна быть после всех маршрутов)
app.use((err, req, res, next) => {
  console.error('❌ Необработанная ошибка:', err);
  console.error('Детали ошибки:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({ message: 'Instagram API Server is running!' });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Порт ${PORT} уже занят. Завершите другой процесс на порту ${PORT}:\n   macOS/Linux: lsof -i :${PORT}   затем   kill -9 <PID>\n   Или закройте другой терминал с бэкендом и запустите снова.\n`);
  } else if (err.code === 'EPERM') {
    console.error(`\n❌ Нет прав на порт ${PORT}. Запустите терминал от имени администратора или проверьте настройки системы.\n`);
  } else {
    console.error('\n❌ Ошибка сервера:', err.message);
  }
  process.exit(1);
});
