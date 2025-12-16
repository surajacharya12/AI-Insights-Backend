# AI Insight - Backend API

A powerful Node.js/Express backend for the AI Insight learning platform, featuring AI-powered course generation, quiz creation, and PDF chat capabilities.

## 🚀 Features

- **User Authentication** - Register, login, and manage user accounts
- **AI Course Generation** - Generate complete course layouts and content using Google Gemini AI
- **Course Enrollment & Progress Tracking** - Track user progress through courses at the topic level
- **Quiz Generation** - AI-powered quiz generation on any topic
- **Chat with PDF** - Upload PDFs and chat with them using AI
- **Resource Management** - Upload and share learning resources
- **ThinkBot** - AI chatbot for answering questions

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Google Gemini AI (Generative AI)
- **File Storage**: Cloudinary
- **Other**: CORS, dotenv

## 📁 Project Structure

```
aiinsight_backend/
├── config/
│   ├── db.js              # Database connection
│   ├── schema.js          # Drizzle ORM schemas
│   └── cloudinary.js      # Cloudinary configuration
├── route/
│   ├── user.js            # User authentication routes
│   ├── courses.js         # Course fetching routes
│   ├── enroll-course.js   # Course enrollment routes
│   ├── course-progress.js # Progress tracking routes
│   ├── generate-course-layout.js  # AI course layout generation
│   ├── generate-course-content.js # AI course content generation
│   ├── generate-quiz.js   # AI quiz generation
│   ├── chatpdf.js         # Chat with PDF feature
│   ├── resources.js       # Resource management
│   ├── thinkbot.js        # AI chatbot
│   └── aiTools.route.js   # Other AI tools
├── utils/
├── server.js              # Main Express app
└── drizzle.config.js      # Drizzle configuration
```

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `photo` - Profile photo URL (optional)

### Courses Table
- `id` - Primary key
- `cid` - Unique course ID
- `name` - Course name
- `description` - Course description
- `noOfChapters` - Number of chapters
- `includeVideo` - Whether to include YouTube videos
- `level` - Difficulty level
- `category` - Course category
- `courseJson` - AI-generated course layout (JSON)
- `courseContent` - Full course content (JSON)
- `bannerImageURL` - Course banner image
- `userEmail` - Creator's email

### Enrollments Table
- `id` - Primary key
- `courseId` - Reference to course
- `userEmail` - User's email
- `completedChapters` - Progress tracking (JSON: `{"0-1": true, "0-2": true}`)

### Quiz History Table
- `id` - Primary key
- `userEmail` - User's email
- `topic` - Quiz topic
- `score` - User's score
- `totalQuestions` - Total questions
- `date` - Quiz date

### User PDFs Table
- `id` - Primary key
- `userEmail` - User's email
- `fileName` - Original file name
- `geminiFileName` - File name in Gemini
- `geminiFileUri` - File URI for content generation
- `uploadedAt` - Upload timestamp

### Resources Table
- `id` - Primary key
- `topic` - Resource topic
- `description` - Resource description
- `authorName/Email` - Author info
- `fileUrl` - Cloudinary URL
- `views` - View count

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/register` | Register new user |
| POST | `/user/login` | User login |
| GET | `/user/:id` | Get user by ID |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/get-courses` | Get courses (by ID, user, or all) |
| POST | `/api/courses` | Create course layout |
| GET | `/api/generate-course-content` | Generate/get course content |

### Enrollment & Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/enroll` | Enroll in course |
| GET | `/api/enroll?userId=X` | Get enrolled courses |
| GET | `/api/course-progress?userId=X&courseId=Y` | Get progress |
| POST | `/api/course-progress` | Update topic completion |

### Quiz
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-quiz` | Generate quiz on topic |
| POST | `/api/generate-quiz/save` | Save quiz result |
| GET | `/api/generate-quiz/history` | Get quiz history |

### Chat with PDF
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chatpdf/upload` | Upload PDF |
| POST | `/api/chatpdf/chat` | Chat with PDF |
| GET | `/api/chatpdf/files` | Get user's PDFs |
| DELETE | `/api/chatpdf/file/:id` | Delete PDF |

### Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources` | Get all resources |
| POST | `/api/resources` | Upload resource |
| DELETE | `/api/resources/:id` | Delete resource |

### AI Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bot` | ThinkBot chat |
| POST | `/api/ai-tools/*` | Various AI tools |

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Gemini API key
- Cloudinary account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/surajacharya12/AI-Insights-Backend.git
cd aiinsight_backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
YOUTUBE_API_KEY=your_youtube_api_key
PORT=3001
```

4. Run database migrations:
```bash
npx drizzle-kit push
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## 🌐 Deployment

The backend is deployed on Vercel:
- **Production**: `https://ai-insights-backend.vercel.app`

## 📄 License

MIT License

## 👤 Author

**Suraj Acharya**
- GitHub: [@surajacharya12](https://github.com/surajacharya12)
