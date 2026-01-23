
import express from "express";
import { coursesTable, usersTable } from "../config/schema.js";
import db from "../config/db.js";
import { desc, eq, and, sql } from "drizzle-orm";

const router = express.Router();

router.get("/", async (req, res) => {
    const { courseId, userId, search } = req.query;
    // Note: req.user might be available if you have auth middleware, but we'll stick to query params as requested.

    try {
        // Case 1: Get all generated courses (courseId == 0)
        if (courseId === "0") {
            const searchQuery = search?.toLowerCase();
            let result = await db
                .select()
                .from(coursesTable)
                .orderBy(desc(coursesTable.id));

            if (searchQuery) {
                result = result.filter(course =>
                    (course.name?.toLowerCase() || "").includes(searchQuery)
                );
            }
            console.log("Fetched courses (all):", result.length);
            return res.json(result);
        }

        // Case 2: Get specific course by ID
        if (courseId) {
            const result = await db
                .select()
                .from(coursesTable)
                .where(eq(coursesTable.cid, courseId));

            console.log("Fetched course by ID:", result.length);
            return res.json(result[0] || null);
        }

        // Case 3: Get courses by current user
        let userEmail = null;

        if (userId) {
            const dbUser = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.id, userId));

            if (dbUser.length > 0) {
                userEmail = dbUser[0].email;
            }
        }

        if (!userEmail) {
            console.log("No user email found for ID:", userId);
            return res.json([]); // Return empty array instead of 400
        }

        const result = await db
            .select()
            .from(coursesTable)
            .where(eq(coursesTable.userEmail, userEmail))
            .orderBy(desc(coursesTable.id));

        console.log("Fetched user courses for:", userEmail, "Count:", result.length);
        return res.json(result);

    } catch (error) {
        console.error("Error in courses route:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
