// Express router for enrollment actions
import express from "express";
import db from "../config/db.js";
import { coursesTable, enrollmentsTable, usersTable } from "../config/schema.js";
import { eq, and, desc } from "drizzle-orm";

const router = express.Router();

// POST / - enroll a user in a course
router.post("/", async (req, res) => {
    try {
        const { courseId, userId } = req.body;
        const numericUserId = Number(userId);
        if (!courseId || !numericUserId) {
            return res.status(400).json({ error: "courseId and userId are required" });
        }
        // Find user email by userId
        const userResult = await db.select().from(usersTable).where(eq(usersTable.id, numericUserId));
        if (userResult.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        const userEmail = userResult[0].email;

        // Check if already enrolled
        const existing = await db
            .select()
            .from(enrollmentsTable)
            .where(and(eq(enrollmentsTable.userEmail, userEmail), eq(enrollmentsTable.courseId, courseId)));
        if (existing.length > 0) {
            return res.json({ message: "Already enrolled in this course" });
        }

        const result = await db
            .insert(enrollmentsTable)
            .values({ userEmail, courseId })
            .returning();
        return res.json(result);
    } catch (error) {
        console.error("Enroll error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET / - get enrolled courses for a user (optional courseId filter)
router.get("/", async (req, res) => {
    try {
        const { userId, courseId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "userId query param required" });
        }
        const userResult = await db.select().from(usersTable).where(eq(usersTable.id, Number(userId)));
        if (userResult.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        const userEmail = userResult[0].email;

        let query = db
            .select()
            .from(coursesTable)
            .innerJoin(enrollmentsTable, eq(coursesTable.cid, enrollmentsTable.courseId))
            .where(eq(enrollmentsTable.userEmail, userEmail));
        if (courseId) {
            query = query.where(eq(enrollmentsTable.courseId, courseId));
        }
        const result = await query.orderBy(desc(enrollmentsTable.id));
        return res.json(result);
    } catch (error) {
        console.error("Get enrollments error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;