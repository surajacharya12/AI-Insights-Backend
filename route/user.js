import express from "express";
import { usersTable } from "../config/schema.js";
import db from "../config/db.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Hash the password before storing
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await db.insert(usersTable).values({
            name,
            email,
            password: hashedPassword
        }).returning();

        res.json(user);
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Failed to register user" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.select().from(usersTable).where(eq(usersTable.email, email));

        if (user.length > 0) {
            // Compare the provided password with the hashed password
            const isPasswordValid = await bcrypt.compare(password, user[0].password);

            if (isPasswordValid) {
                // Don't send the password back to the client
                const { password: _, ...userWithoutPassword } = user[0];
                res.json(userWithoutPassword);
            } else {
                res.status(401).json({ error: "Invalid credentials" });
            }
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});

router.get("/", async (req, res) => {
    const users = await db.select().from(usersTable);
    res.json(users);
});


router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const user = await db.select().from(usersTable).where(eq(usersTable.id, id));
    res.json(user);
});

// Update user profile with optional photo upload
router.put("/:id", upload.single('photo'), async (req, res) => {
    const { id } = req.params;
    try {
        const updateData = { ...req.body };

        // If a photo was uploaded, add the Cloudinary URL to update data
        if (req.file) {
            updateData.photo = req.file.path; // Cloudinary URL
        }

        const user = await db.update(usersTable)
            .set(updateData)
            .where(eq(usersTable.id, id))
            .returning();

        res.json(user[0]);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});

// Change password endpoint
router.put("/:id/password", async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    try {
        // Get user with password
        const users = await db.select().from(usersTable).where(eq(usersTable.id, id));

        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = users[0];

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        const updatedUser = await db.update(usersTable)
            .set({ password: hashedPassword })
            .where(eq(usersTable.id, id))
            .returning();

        // Don't send password back
        const { password: _, ...userWithoutPassword } = updatedUser[0];
        res.json({ message: "Password updated successfully", user: userWithoutPassword });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ error: "Failed to change password" });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const user = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
    res.json(user);
});

export default router;    