const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb+srv://scob198350:Scob1337%40@cluster0.9icnocz.mongodb.net/chat-app?retryWrites=true&w=majority&appName=Cluster0';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
};

module.exports = connectDB;
