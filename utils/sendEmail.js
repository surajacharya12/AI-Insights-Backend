import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (email, subject, text, html) => {
    try {
        const host = process.env.SMTP_HOST.includes('@') ? 'smtp.gmail.com' : process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || '587');
        const secure = port === 465;

        console.log("Preparing to send email...");
        console.log("SMTP Config:", {
            host: host,
            port: port,
            secure: secure,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS ? "****" : "MISSING"
        });

        const transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: secure,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        console.log(`Sending email to: ${email}`);

        const mailOptions = {
            from: `"AI Insight" <${process.env.SMTP_USER}>`, // Add a nice sender name
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
