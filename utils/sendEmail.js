import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (email, subject, text, html) => {
    try {
        const host = 'smtp.gmail.com';
        const port = 587;
        const secure = false;

        console.log("Preparing to send email...");
        console.log("SMTP Config:", {
            host: host,
            port: port,
            secure: secure,
            user: "bct2080@gmail.com",
            pass: "fbaimcytfzrmscxx"
        });

        const transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: secure,
            auth: {
                user: "bct2080@gmail.com",
                pass: "fbaimcytfzrmscxx",
            },
        });

        console.log(`Sending email to: ${email}`);

        const mailOptions = {
            from: `"AI Insight" <bct2080@gmail.com>`, // Add a nice sender name
            to: email,
            subject: subject,
            text: text, // Plain text fallback
            html: html || text // Use HTML if provided, otherwise text
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent successfully: ", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

export default sendEmail;
