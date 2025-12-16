// Express router for course progress tracking
import express from "express";
import db from "../config/db.js";
import { enrollmentsTable, usersTable } from "../config/schema.js";
import { eq, and } from "drizzle-orm";

const router = express.Router();

// GET /progress - Get progress for a specific course enrollment
router.get("/", async (req, res) => {
    try {
        const { userId, courseId } = req.query;

        if (!userId || !courseId) {
            return res.status(400).json({ error: "userId and courseId are required" });
        }

        // Get user email
        const userResult = await db.select().from(usersTable).where(eq(usersTable.id, Number(userId)));
        if (userResult.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        const userEmail = userResult[0].email;

        // Get enrollment with progress
        const enrollment = await db
            .select()
            .from(enrollmentsTable)
            .where(
                and(
                    eq(enrollmentsTable.userEmail, userEmail),
                    eq(enrollmentsTable.courseId, courseId)
                )
            );

        if (enrollment.length === 0) {
            return res.status(404).json({ error: "Enrollment not found" });
        }

        // completedChapters is actually completedTopics in our new format
        // Format: { "chapterIndex-topicIndex": true }
        const completedTopics = enrollment[0].completedChapters || {};

        return res.json({
            enrollmentId: enrollment[0].id,
            courseId: enrollment[0].courseId,
            completedTopics,
        });
    } catch (error) {
        console.error("Get progress error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /progress - Update progress (mark topic as complete/incomplete)
router.post("/", async (req, res) => {
    try {
        const { userId, courseId, chapterIndex, topicIndex, completed } = req.body;

        if (!userId || !courseId || chapterIndex === undefined || topicIndex === undefined) {
            return res.status(400).json({
                error: "userId, courseId, chapterIndex, and topicIndex are required"
            });
        }

        // Get user email
        const userResult = await db.select().from(usersTable).where(eq(usersTable.id, Number(userId)));
        if (userResult.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        const userEmail = userResult[0].email;

        // Get current enrollment
        const enrollment = await db
            .select()
            .from(enrollmentsTable)
            .where(
                and(
                    eq(enrollmentsTable.userEmail, userEmail),
                    eq(enrollmentsTable.courseId, courseId)
                )
            );

        if (enrollment.length === 0) {
            return res.status(404).json({ error: "Enrollment not found. Please enroll first." });
        }

        // Get current completed topics
        let completedTopics = enrollment[0].completedChapters || {};

        // Ensure it's an object (handle legacy array format)
        if (Array.isArray(completedTopics)) {
            completedTopics = {};
        }

        const topicKey = `${chapterIndex}-${topicIndex}`;

        if (completed) {
            completedTopics[topicKey] = true;
        } else {
            delete completedTopics[topicKey];
        }

        // Update the enrollment
        const result = await db
            .update(enrollmentsTable)
            .set({ completedChapters: completedTopics })
            .where(eq(enrollmentsTable.id, enrollment[0].id))
            .returning();

        return res.json({
            success: true,
            enrollmentId: result[0].id,
            completedTopics: result[0].completedChapters,
        });
    } catch (error) {
        console.error("Update progress error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /progress/bulk - Bulk update progress (mark multiple topics)
router.post("/bulk", async (req, res) => {
    try {
        const { userId, courseId, completedTopics } = req.body;

        if (!userId || !courseId || !completedTopics) {
            return res.status(400).json({
                error: "userId, courseId, and completedTopics are required"
            });
        }

        // Get user email
        const userResult = await db.select().from(usersTable).where(eq(usersTable.id, Number(userId)));
        if (userResult.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        const userEmail = userResult[0].email;

        // Get current enrollment
        const enrollment = await db
            .select()
            .from(enrollmentsTable)
            .where(
                and(
                    eq(enrollmentsTable.userEmail, userEmail),
                    eq(enrollmentsTable.courseId, courseId)
                )
            );

        if (enrollment.length === 0) {
            return res.status(404).json({ error: "Enrollment not found. Please enroll first." });
        }

        // Update the enrollment with the new completedTopics object
        const result = await db
            .update(enrollmentsTable)
            .set({ completedChapters: completedTopics })
            .where(eq(enrollmentsTable.id, enrollment[0].id))
            .returning();

        return res.json({
            success: true,
            enrollmentId: result[0].id,
            completedTopics: result[0].completedChapters,
        });
    } catch (error) {
        console.error("Bulk update progress error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
