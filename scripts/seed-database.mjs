import { readFile } from "node:fs/promises";
import dns from "node:dns";
import nextEnv from "@next/env";
import mongoose from "mongoose";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "kelulusan";
const collectionName = process.env.MONGODB_COLLECTION || "students";
const sourceFile =
  process.env.SEED_FILE || new URL("../data/students.sample.json", import.meta.url);

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

const raw = await readFile(sourceFile, "utf8");
const records = JSON.parse(raw);

if (!Array.isArray(records) || records.length === 0) {
  throw new Error("Seed file harus berisi array data siswa dan tidak boleh kosong.");
}

await connectWithDnsFallback();

const collection = mongoose.connection.collection(collectionName);
await collection.deleteMany({});
await collection.insertMany(records);
await collection.createIndex({ nisn: 1, tanggalLahir: 1 }, { unique: true });

console.log(`Seed selesai: ${records.length} data masuk ke ${dbName}.${collectionName}.`);

await mongoose.disconnect();

async function connectWithDnsFallback() {
  const options = { dbName, bufferCommands: false };

  try {
    return await mongoose.connect(uri, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("querySrv ECONNREFUSED")) {
      throw error;
    }

    const customDnsServers = process.env.MONGODB_DNS_SERVERS
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const fallbackServers =
      customDnsServers && customDnsServers.length > 0
        ? customDnsServers
        : ["1.1.1.1", "8.8.8.8"];

    dns.setServers(fallbackServers);
    return mongoose.connect(uri, options);
  }
}
