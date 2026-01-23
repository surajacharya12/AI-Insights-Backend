import "dotenv/config";
import express from "express";
import cors from "cors";

import userRouter from "./route/user.js";
import bot from "./route/thinkbot.js";
import aiToolsRoutes from "./route/aiTools.route.js";
import enrollRouter from "./route/enroll-course.js";
import courseRouter from "./route/generate-course-layout.js";
import generateCourseContentRouter from "./route/generate-course-content.js";
import getCoursesRouter from "./route/courses.js";
import generateQuizRouter from "./route/generate-quiz.js";
import chatpdfRouter from "./route/chatpdf.js";
import resourcesRouter from "./route/resources.js";
import courseProgressRouter from "./route/course-progress.js";
import summarizeRoute from "./route/summarize.js";
import thumbnailsRouter from "./route/thumnaills.js";

const app = express();
const port = process.env.PORT || 3001;

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
  res.send("Hello from AI Insight backend!");
});

app.use("/user", userRouter);
app.use("/bot", bot);
app.use("/api/ai-tools", aiToolsRoutes);
app.use("/api/courses", courseRouter);
app.use("/api/generate-course-content", generateCourseContentRouter);
app.use("/api/enroll", enrollRouter);
app.use("/api/get-courses", getCoursesRouter);
app.use("/api/generate-quiz", generateQuizRouter);
app.use("/api/chatpdf", chatpdfRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api/course-progress", courseProgressRouter);
app.use("/api", summarizeRoute);
app.use("/api/thumbnails", thumbnailsRouter);


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
/* =====================================================
   SERVER
===================================================== */
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Long AI requests safety
server.setTimeout(10 * 60 * 1000);

export default app;
