
import express from "express";
import { coursesTable, usersTable } from "../config/schema.js";
import db from "../config/db.js";
import { desc, eq, and, ne, sql } from "drizzle-orm";

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
                .where(
                    and(
                        ne(coursesTable.courseContent, "{}"),
                        ne(coursesTable.courseContent, "[]"),
                        ne(coursesTable.courseContent, ""),
                        sql`${coursesTable.courseContent} IS NOT NULL`
                    )
                )
                .orderBy(desc(coursesTable.id));

            if (searchQuery) {
                result = result.filter(course =>
                    (course.name?.toLowerCase() || "").includes(searchQuery)
                );
            }
            console.log("Fetched generated courses (filtered):", result.length);
            return res.json(result);
        }

        // Case 2: Get specific course by ID
        if (courseId) {
            const result = await db
                .select()
                .from(coursesTable)
                .where(eq(coursesTable.cid, courseId));

            console.log("Fetched course by ID:", result.length);
            return res.json(result[0]);
        }

        // Case 3: Get courses by current user
        // We expect userId to be passed from frontend. 
        // If not, we can't identify the user in this stateless request without auth middleware.

        let userEmail = null;

        if (userId) {
            // Fetch user email from usersTable using userId
            const dbUser = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.id, userId));

            if (dbUser.length > 0) {
                userEmail = dbUser[0].email;
            }
        }

        if (!userEmail) {
            // If we couldn't find the user or userId wasn't provided
            return res.status(400).json({ error: "User ID is required to fetch user courses" });
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
