import express from "express";
import { resourcesTable } from "../config/schema.js";
import db from "../config/db.js";
import { eq, desc } from "drizzle-orm";
import { uploadResource } from "../config/cloudinary.js";

const router = express.Router();

// Get all resources
router.get("/", async (req, res) => {
    try {
        const resources = await db.select().from(resourcesTable).orderBy(desc(resourcesTable.id));
        res.json(resources);
    } catch (error) {
        console.error("Error fetching resources:", error);
        res.status(500).json({ error: "Failed to fetch resources" });
    }
});

// Upload a new resource
router.post("/", uploadResource.single('file'), async (req, res) => {
    try {
        const { topic, description, authorName, authorEmail } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const newResource = await db.insert(resourcesTable).values({
            topic,
            description,
            authorName,
            authorEmail,
            fileUrl: req.file.path, // Cloudinary URL
            fileName: req.file.originalname,
            date: new Date().toISOString().split('T')[0],
            views: 0
        }).returning();

        res.status(201).json(newResource[0]);
    } catch (error) {
        console.error("Error uploading resource:", error);
        res.status(500).json({ error: "Failed to upload resource" });
    }
});

// Increment view count
router.put("/:id/view", async (req, res) => {
    const { id } = req.params;
    try {
        const resource = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id));

        if (resource.length === 0) {
            return res.status(404).json({ error: "Resource not found" });
        }

        const updatedResource = await db.update(resourcesTable)
            .set({ views: resource[0].views + 1 })
            .where(eq(resourcesTable.id, id))
            .returning();

        res.json(updatedResource[0]);
    } catch (error) {
        console.error("Error updating view count:", error);
        res.status(500).json({ error: "Failed to update view count" });
    }
});

// Delete a resource
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const { userEmail } = req.query; // Get email from query params for verification

    try {
        const resource = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id));

        if (resource.length === 0) {
            return res.status(404).json({ error: "Resource not found" });
        }

        if (resource[0].authorEmail !== userEmail) {
            return res.status(403).json({ error: "Unauthorized: You can only delete your own resources" });
        }

        await db.delete(resourcesTable).where(eq(resourcesTable.id, id));

        res.json({ message: "Resource deleted successfully" });
    } catch (error) {
        console.error("Error deleting resource:", error);
        res.status(500).json({ error: "Failed to delete resource" });
    }
});

export default router;
