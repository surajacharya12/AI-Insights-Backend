import { pgTable, varchar, boolean, integer, json, text } from "drizzle-orm/pg-core";

// Users Table
export const usersTable = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  photo: varchar("photo", { length: 255 }), // Optional
  resetOtp: varchar("resetOtp", { length: 6 }),
  resetOtpExpires: varchar("resetOtpExpires"),
  isVerified: boolean("isVerified").default(false),
});

// Courses Table
export const coursesTable = pgTable("courses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  cid: varchar("cid", { length: 255 }).notNull().unique(),
  name: varchar("name"),
  description: varchar("description"),
  noOfChapters: integer("noOfChapters").notNull(),
  includeVideo: boolean("includeVideo").default(false),
  level: varchar("level").notNull(),
  category: varchar("category"),
  courseJson: json("courseJson"),
  userEmail: varchar("userEmail")
    .notNull()
    .references(() => usersTable.email),
  bannerImageURL: text("bannerImageURL").default(""),
  courseContent: json("courseContent"),
});

export const enrollmentsTable = pgTable("enrollments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: varchar("courseId", { length: 255 })
    .notNull()
    .references(() => coursesTable.cid),
  userEmail: varchar("userEmail")
    .notNull()
    .references(() => usersTable.email),
  completedChapters: json("completedChapters"),
});

export const quizHistoryTable = pgTable("quiz_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userEmail: varchar("userEmail")
    .notNull()
    .references(() => usersTable.email),
  topic: varchar("topic").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("totalQuestions").notNull(),
  date: varchar("date").notNull(),
});

// User PDFs Table for Chat with PDF feature
export const userPdfsTable = pgTable("user_pdfs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  userEmail: varchar("user_email", { length: 255 })
    .notNull()
    .references(() => usersTable.email),

  fileName: varchar("file_name", { length: 255 }).notNull(),

  // 🔥 NEW: extracted PDF text
  pdfText: text("pdf_text").notNull(),

  uploadedAt: varchar("uploaded_at", { length: 50 }).notNull(),
});

export const resourcesTable = pgTable("resources", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  topic: varchar("topic").notNull(),
  description: varchar("description").notNull(),
  authorName: varchar("authorName").notNull(),
  authorEmail: varchar("authorEmail").notNull(),
  fileUrl: varchar("fileUrl").notNull(),
  fileName: varchar("fileName").notNull(),
  date: varchar("date").notNull(),
  views: integer("views").default(0),
});

