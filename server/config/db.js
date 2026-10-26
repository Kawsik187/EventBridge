import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventbridge', {
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
