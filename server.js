import "dotenv/config";
import express from "express";
import cors from "cors";

// Route imports moved to dynamic loading below

const app = express();
const port = process.env.PORT || 3001;

// 🟢 DIAGNOSTIC ROUTE - ABSOLUTE TOP
app.get("/fast-ping", (req, res) => {
  res.json({
    success: true,
    message: "Server reached! No imports blocked this.",
    time: new Date().toISOString()
  });
});

/* =====================================================
   GLOBAL MIDDLEWARE
===================================================== */
app.use(cors());

/**
 * 🔑 VERY IMPORTANT
 * Increase body size for base64 images
 */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* =====================================================
   ROUTES
===================================================== */
app.get("/", (req, res) => {
  res.json({
    message: "AI Insight API is online",
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
});

app.get("/status", async (req, res) => {
  try {
    // Test DB connection
    const { pool } = await import("./config/db.js");
    const dbTest = await pool.query("SELECT NOW()");

    return res.json({
      success: true,
      message: "Backend and Database are running",
      dbTime: dbTest.rows[0].now,
      env: process.env.NODE_ENV
    });
  } catch (err) {
    console.error("Status check failed:", err);
    return res.status(500).json({
      success: false,
      message: "Backend is running but Database is failing",
      error: err.message
    });
  }
});

app.use("/user", (req, res, next) => import("./route/user.js").then(m => m.default(req, res, next)));
app.use("/bot", (req, res, next) => import("./route/thinkbot.js").then(m => m.default(req, res, next)));
app.use("/api/ai-tools", (req, res, next) => import("./route/aiTools.route.js").then(m => m.default(req, res, next)));
app.use("/api/courses", (req, res, next) => import("./route/generate-course-layout.js").then(m => m.default(req, res, next)));
app.use("/api/generate-course-content", (req, res, next) => import("./route/generate-course-content.js").then(m => m.default(req, res, next)));
app.use("/api/enroll", (req, res, next) => import("./route/enroll-course.js").then(m => m.default(req, res, next)));
app.use("/api/get-courses", (req, res, next) => import("./route/courses.js").then(m => m.default(req, res, next)));
app.use("/api/generate-quiz", (req, res, next) => import("./route/generate-quiz.js").then(m => m.default(req, res, next)));
app.use("/api/chatpdf", (req, res, next) => import("./route/chatpdf.js").then(m => m.default(req, res, next)));
app.use("/api/resources", (req, res, next) => import("./route/resources.js").then(m => m.default(req, res, next)));
app.use("/api/course-progress", (req, res, next) => import("./route/course-progress.js").then(m => m.default(req, res, next)));
app.use("/api", (req, res, next) => import("./route/summarize.js").then(m => m.default(req, res, next)));
app.use("/api/thumbnails", (req, res, next) => import("./route/thumnaills.js").then(m => m.default(req, res, next)));


/* =====================================================
   ERROR HANDLER (Payload Friendly)
===================================================== */
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Uploaded file is too large. Max limit is 50MB.",
    });
  }
  next(err);
});

/* =====================================================
   SERVER
===================================================== */
if (!process.env.VERCEL) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  // Long AI requests safety
  server.setTimeout(10 * 60 * 1000);
}

export default app;
