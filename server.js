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

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.setTimeout(600000);
