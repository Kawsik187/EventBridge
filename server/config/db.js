import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventbridge';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[EventBridge] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`[EventBridge] Database Connection Error: Unable to connect to MongoDB (${error.message}).`);
    return false;
  }
};

export default connectDB;
