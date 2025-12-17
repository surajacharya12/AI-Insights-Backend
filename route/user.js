import express from "express";
import { usersTable } from "../config/schema.js";
import db from "../config/db.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { upload } from "../config/cloudinary.js";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

// Register endpoint modified to send OTP
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiration = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Check if user exists
        const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, email));

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            if (existingUser.isVerified) {
                return res.status(400).json({ error: "User already exists" });
            }

            // Update unverified user
            await db.update(usersTable).set({
                name,
                password: hashedPassword,
                resetOtp: otp,
                resetOtpExpires: expiration.toString()
            }).where(eq(usersTable.email, email));
        } else {
            // Create new unverified user
            await db.insert(usersTable).values({
                name,
                email,
                password: hashedPassword,
                resetOtp: otp,
                resetOtpExpires: expiration.toString(),
                isVerified: false
            });
        }

        console.log(`[DEBUG] OTP for ${email}: ${otp}`); // Fallback for testing

        const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #6d28d9; margin: 0;">AI Insight</h1>
                <p style="color: #666;">Unlock your potential with AI-powered learning</p>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
                <p style="font-size: 16px; color: #374151; margin-bottom: 10px;">Your Verification Code</p>
                <div style="font-size: 32px; font-weight: bold; color: #6d28d9; letter-spacing: 5px; margin: 10px 0;">${otp}</div>
                <p style="font-size: 14px; color: #6b7280;">This code will expire in 10 minutes.</p>
            </div>
            <div style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
                <p>If you didn't request this code, you can safely ignore this email.</p>
            </div>
        </div>
        `;

        await sendEmail(email, "Signup Verification OTP", `Your OTP for signup verification is: ${otp}`, emailHtml);

        res.json({ message: "OTP sent to your email" });
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

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiration = Date.now() + 10 * 60 * 1000; // 10 minutes

        await db.update(usersTable)
            .set({
                resetOtp: otp,
                resetOtpExpires: expiration.toString()
            })
            .where(eq(usersTable.email, email));

        console.log(`[DEBUG] Forgot Password OTP for ${email}: ${otp}`); // Fallback for testing

        const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #6d28d9; margin: 0;">AI Insight</h1>
                <p style="color: #666;">Password Reset Request</p>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
                <p style="font-size: 16px; color: #374151; margin-bottom: 10px;">Your Reset Code</p>
                <div style="font-size: 32px; font-weight: bold; color: #6d28d9; letter-spacing: 5px; margin: 10px 0;">${otp}</div>
                <p style="font-size: 14px; color: #6b7280;">This code will expire in 10 minutes.</p>
            </div>
            <div style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
                <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
        </div>
        `;

        await sendEmail(email, "Password Reset OTP", `Your OTP for password reset is: ${otp}`, emailHtml);

        res.json({ message: "OTP sent to your email" });
    } catch (error) {
        console.error("Error in forgot password:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

router.post("/verify-email", async (req, res) => {
    const { email, otp } = req.body;
    try {
        const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = users[0];

        if (user.resetOtp !== otp || parseInt(user.resetOtpExpires) < Date.now()) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        await db.update(usersTable)
            .set({
                isVerified: true,
                resetOtp: null,
                resetOtpExpires: null
            })
            .where(eq(usersTable.email, email));

        const { password: _, ...userWithoutPassword } = user;
        // Since we are verifying, we can treat this as "logged in" or just verified
        userWithoutPassword.isVerified = true;

        res.json({ message: "Email verified successfully", user: userWithoutPassword });

    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ error: "Failed to verify email" });
    }
});

router.post("/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = users[0];

        if (user.resetOtp !== otp || parseInt(user.resetOtpExpires) < Date.now()) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await db.update(usersTable)
            .set({
                password: hashedPassword,
                resetOtp: null,
                resetOtpExpires: null
            })
            .where(eq(usersTable.email, email));

        res.json({ message: "Password reset successfully" });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ error: "Failed to reset password" });
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