const mongoose = require('mongoose')

const MONGO_URI = 'mongodb://localhost:27017/instagram'

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    const users = await mongoose.connection.db.collection('users').find({}).toArray();

    console.log(`Found ${users.length} total users.`);

    for (const u of users) {
      console.log(`\nUser: ${u.username} (ID: ${u._id})`);
      if (u.profiles && u.profiles.length > 0) {
          console.log('  Profiles:', u.profiles.map(p => `Name: ${p.username}, ID: ${p.id}`).join('; '));
      } else {
          console.log('  No profiles.');
      }

      const posts = await mongoose.connection.db.collection('posts').find({
        user: u._id
      }).toArray();

      if (posts.length > 0) {
          console.log(`  Posts (${posts.length}):`);
          posts.forEach(p => {
            console.log(`    - ID: ${p._id}, Title: "${p.title}", ProfileId: ${p.profileId}`);
          });
      } else {
          console.log('  No posts.');
      }
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await mongoose.disconnect()
  }
}

run()

