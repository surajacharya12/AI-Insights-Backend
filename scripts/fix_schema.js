import "dotenv/config";
import { Client } from "pg";

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function fixSchema() {
    try {
        await client.connect();
        console.log("Connected to database");

        // 1. Clear existing bad data
        console.log("Clearing bad data from courseContent...");
        await client.query('UPDATE courses SET "courseContent" = NULL');

        // 2. Alter column type
        console.log("Altering courseContent column type to JSON...");
        await client.query(
            'ALTER TABLE courses ALTER COLUMN "courseContent" TYPE json USING "courseContent"::json'
        );

        console.log("Schema update successful!");
    } catch (err) {
        console.error("Error updating schema:", err);
    } finally {
        await client.end();
    }
}

fixSchema();
