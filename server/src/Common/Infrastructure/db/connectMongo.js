import mongoose from "mongoose";

let isConnected = false;

export async function connectMongo(uri, options = {}) {
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (isConnected) {
    return mongoose.connection;
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    autoIndex: false, // индексы через migrations / prod-safe
    serverSelectionTimeoutMS: 5000,
    ...options,
  });

  isConnected = true;

  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected");
  });

  return mongoose.connection;
}

export async function disconnectMongo() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}
