import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  if (cachedPromise) {
    return cachedPromise;
  }
  cachedPromise = (async () => {
    try {
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        console.warn('[EventBridge] WARNING: MONGODB_URI environment variable is not defined! Falling back to 127.0.0.1:27017.');
      }
      const targetUri = mongoUri || 'mongodb://127.0.0.1:27017/eventbridge';
      const conn = await mongoose.connect(targetUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[EventBridge] MongoDB Connected: ${conn.connection.host}`);
      return true;
    } catch (error) {
      cachedPromise = null;
      console.error(`[EventBridge] Database Connection Error: Unable to connect to MongoDB (${error.message}).`);
      return false;
    }
  })();
  return cachedPromise;
};

export default connectDB;

