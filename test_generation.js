import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { coursesTable } from "./config/schema.js";
import axios from "axios";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function testGeneration() {
    try {
        console.log("Fetching a course from DB...");
        const courses = await db.select().from(coursesTable).limit(1);

        if (courses.length === 0) {
            console.log("No courses found in DB to test.");
            return;
        }

        const course = courses[0];
        console.log(`Found course: ${course.name} (${course.cid})`);

        // Prepare payload
        // courseJson might be a string or object depending on how it was saved. 
        // Schema says json(), so likely object. But let's be safe.
        let courseLayout = course.courseJson;
        if (typeof courseLayout === 'string') {
            try {
                courseLayout = JSON.parse(courseLayout);
            } catch (e) {
                console.error("Failed to parse courseJson from DB");
                return;
            }
        }

        // The API expects: { courseJson, courseTitle, courseId }
        // And courseJson should have a 'chapters' array. 
        // Usually courseLayout has a 'course' property which contains 'chapters'.
        // Let's check the structure.
        // Based on previous files: courseLayout = course?.courseJson?.course

        // Adjusting payload to match what frontend sends.
        // Frontend sends: 
        // courseJson: courseLayout (which is course.courseJson.course)
        // courseTitle: course.name
        // courseId: course.cid

        const payloadCourseJson = courseLayout.course || courseLayout;

        const payload = {
            courseJson: payloadCourseJson,
            courseTitle: course.name,
            courseId: course.cid,
        };

        console.log("Sending request to generate content...");
        console.log("This may take a while due to rate limiting delays...");

        const response = await axios.post("http://localhost:3001/api/generate-course-content", payload);

        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(response.data, null, 2).substring(0, 200) + "...");

    } catch (error) {
        console.error("Test failed:", error.message);
        if (error.response) {
            console.error("API Error Response:", error.response.data);
        }
    } finally {
        await pool.end();
    }
}

testGeneration();
