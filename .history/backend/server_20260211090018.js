const express = require('express')
const compression = require('compression')
const connectDB = require('./src/config/db')
require('dotenv').config()

process.on('uncaughtException', (err) => {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА (Uncaught Exception):', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА (Unhandled Rejection):', reason)
})

const app = express()

app.use(compression())

connectDB()

app.use(express.json({ limit: '1tb' }))
app.use(express.urlencoded({ extended: true, limit: '1tb' }))

app.use(
  require('cors')({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

app.use('/api/auth', require('./src/routes/authRoutes'))
app.use('/api/search', require('./src/routes/searchRoutes'))
app.use('/api/explore', require('./src/routes/exploreRoutes'))
app.use('/api/users', require('./src/routes/userRoutes'))
app.use('/api/posts', require('./src/routes/postRoutes'))
app.use('/api/notifications', require('./src/routes/notificationRoutes'))

app.use((err, req, res, next) => {
  console.error('❌ Необработанная ошибка:', err)
  console.error('Детали ошибки:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  })

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
})

app.get('/', (req, res) => {
  res.json({ message: 'Instagram API Server is running!' })
})

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '127.0.0.1'

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n❌ Порт ${PORT} уже занят. Завершите другой процесс на порту ${PORT}:\n   macOS/Linux: lsof -i :${PORT}   затем   kill -9 <PID>\n   Или закройте другой терминал с бэкендом и запустите снова.\n`
    )
  } else if (err.code === 'EPERM') {
    console.error(
      `\n❌ Нет прав на порт ${PORT}. Запустите терминал от имени администратора или проверьте настройки системы.\n`
    )
  } else {
    console.error('\n❌ Ошибка сервера:', err.message)
  }
  process.exit(1)
})
