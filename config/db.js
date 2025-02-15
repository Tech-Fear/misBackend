import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();
const MAX_RETRIES = 5;
let retryCount = 0;
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 20,
      minPoolSize: 1,
    });

    console.log(`MongoDB Connected: ${conn.connection.host} (Pool Size: 20)`);
    retryCount = 0;
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(
        `Retrying MongoDB connection (${retryCount}/${MAX_RETRIES})...`
      );
      setTimeout(connectDB, 5000);
    } else {
      console.error("Max retries reached. Could not connect to MongoDB.");
    }
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting to reconnect...");
  if (retryCount < MAX_RETRIES) {
    retryCount++;
    setTimeout(connectDB, 5000);
  } else {
    console.error("Max retries reached. MongoDB not available.");
  }
});
mongoose.connection.on("error", (err) => {
  console.error(`MongoDB Error: ${err.message}`);
});

export default connectDB;
