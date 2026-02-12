const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const MONGO_URI = 'mongodb://localhost:27017/instagram';
const JWT_SECRET = 'your_super_secret_jwt_key_change_this_in_production';
const BACKEND_URL = 'http://localhost:3000/api/posts';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Find user Liudmyla
    const user = await mongoose.connection.db.collection('users').findOne({ username: 'Liudmyla' });
    if (!user) {
        console.error('User Liudmyla not found');
        return;
    }
    console.log('Found user:', user.username, user._id);

    // 2. Generate Token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated token');

    // 3. Create Post via API
    try {
        const postData = {
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // 1x1 red pixel
            title: 'Debug Post',
            caption: 'This is a test post to verify creation',
            profileId: user._id.toString() // Assign to self as profile
        };

        const response = await axios.post(BACKEND_URL, postData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Create Post Response Status:', response.status);
        console.log('Created Post ID:', response.data.post.id);
        console.log('Profile ID in response:', response.data.post.profileId);

    } catch (apiError) {
        console.error('API Error:', apiError.response ? apiError.response.data : apiError.message);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
