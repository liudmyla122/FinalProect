const mongoose = require('mongoose');

// Adjust path if necessary
const MONGO_URI = 'mongodb://localhost:27017/instagram';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Find the user/profile "Luidmyla"
    // Search in User collection
    const users = await mongoose.connection.db.collection('users').find({
      $or: [
        { username: { $regex: 'Luidmyla', $options: 'i' } },
        { fullName: { $regex: 'Luidmyla', $options: 'i' } },
        { 'profiles.username': { $regex: 'Luidmyla', $options: 'i' } }
      ]
    }).toArray();

    console.log(`Found ${users.length} users matching "Luidmyla"`);

    for (const u of users) {
      console.log(`\nUser: ${u.username} (ID: ${u._id})`);
      console.log('Profiles:', JSON.stringify(u.profiles, null, 2));

      // Check if Luidmyla is a profile
      let targetProfileId = null;
      if (u.profiles && Array.isArray(u.profiles)) {
        const p = u.profiles.find(p => p.username && p.username.toLowerCase().includes('luidmyla'));
        if (p) {
            targetProfileId = p.id;
            console.log(`Found matching profile ID: ${targetProfileId}`);
        }
      }

      // 2. Find all posts for this user
      const posts = await mongoose.connection.db.collection('posts').find({
        user: u._id
      }).toArray();

      console.log(`Total posts for user ${u.username}: ${posts.length}`);
      
      posts.forEach(p => {
        console.log(`- Post ID: ${p._id}`);
        console.log(`  Title: ${p.title}`);
        console.log(`  ProfileId: ${p.profileId} (Type: ${typeof p.profileId})`);
        console.log(`  Created: ${p.createdAt}`);
        
        if (targetProfileId) {
            const match = String(p.profileId) === String(targetProfileId);
            console.log(`  Matches Profile "${targetProfileId}"? ${match ? 'YES' : 'NO'}`);
        }
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
