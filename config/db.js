import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined in environment variables!");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000, // 5 second timeout
    idleTimeoutMillis: 30000,
});

const db = drizzle(pool);

export { pool };
export default db;
