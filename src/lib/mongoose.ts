import mongoose from "mongoose";
import dns from "node:dns";

const MONGODB_URI = process.env.MONGODB_URI ?? "";
const MONGODB_DB = process.env.MONGODB_DB ?? "kelulusan";

if (!MONGODB_URI) {
  throw new Error("Tolong definisikan MONGODB_URI di dalam .env.local");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const getMongooseCache = (): MongooseCache => {
  if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null };
  }
  return global.mongoose;
};

export async function connectToDatabase() {
  const cached = getMongooseCache();

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB,
      // Optimasi untuk High Traffic
      maxPoolSize: 100, // Membatasi pool koneksi agar tidak melebihi limit MongoDB Atlas
      minPoolSize: 10,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("querySrv ECONNREFUSED")) {
        const customDnsServers = process.env.MONGODB_DNS_SERVERS
          ?.split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        const fallbackServers =
          customDnsServers && customDnsServers.length > 0
            ? customDnsServers
            : ["1.1.1.1", "8.8.8.8"];

        dns.setServers(fallbackServers);
        return mongoose.connect(MONGODB_URI, opts);
      }
      throw error;
    }).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
