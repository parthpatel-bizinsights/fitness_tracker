# AI Fitness Tracker — Backend Requirements (Updated)

## Project Overview

Build a scalable, production-ready REST API using Node.js, Express.js, PostgreSQL, Sequelize ORM, Cloudinary, and Google Gemini 1.5 Flash (free tier).

---

## Tech Stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| Runtime          | Node.js 20 LTS                                   |
| Framework        | Express.js                                       |
| Database         | PostgreSQL (Neon — free tier)                    |
| ORM              | Sequelize v6                                     |
| Authentication   | JWT (access + refresh tokens)                    |
| Password hashing | bcrypt                                           |
| File storage     | Cloudinary (free tier — 25 GB)                   |
| Image processing | Sharp (resize before upload)                     |
| AI               | Google Gemini 1.5 Flash (free — 1M tokens/month) |
| Validation       | Express Validator + Zod (shared schemas)         |
| Logging          | Morgan (HTTP) + Winston (app-level)              |
| Caching          | Upstash Redis (free — 10k commands/day)          |
| Email            | Resend (free — 3k emails/month)                  |
| Environment      | dotenv                                           |
| Testing          | Jest + Supertest                                 |

---

## Folder Structure

```
src/
  config/
    database.js         ← Sequelize connection
    redis.js            ← Upstash Redis client
    cloudinary.js       ← Cloudinary SDK init
    gemini.js           ← Gemini SDK init
  controllers/
    auth.controller.js
    workout.controller.js
    exercise.controller.js
    session.controller.js
    food.controller.js
    water.controller.js
    weight.controller.js
    measurement.controller.js
    progress.controller.js
    ai.controller.js
    dashboard.controller.js
  routes/
    auth.routes.js
    workout.routes.js
    exercise.routes.js
    session.routes.js
    food.routes.js
    water.routes.js
    weight.routes.js
    measurement.routes.js
    progress.routes.js
    ai.routes.js
    dashboard.routes.js
  middlewares/
    auth.middleware.js        ← JWT verify + attach user
    rateLimiter.middleware.js ← different limiters per route group
    upload.middleware.js      ← Multer config
    validate.middleware.js    ← Express Validator runner
    errorHandler.middleware.js
  models/
    User.js
    WorkoutPlan.js
    Exercise.js
    WorkoutSession.js
    ExerciseLog.js
    FoodLog.js
    WaterLog.js
    WeightLog.js
    BodyMeasurement.js
    ProgressPhoto.js
    ChatMessage.js
    RefreshToken.js
    index.js              ← associations
  migrations/
    (one file per model)
  seeders/
    exercises.seeder.js   ← seeds from wger.de API
    foods.seeder.js       ← seeds common foods
  services/
    gemini.service.js     ← all Gemini calls
    cloudinary.service.js ← upload + delete helpers
    email.service.js      ← Resend email sender
    streak.service.js     ← streak calculation logic
    cache.service.js      ← Redis get/set helpers
    openfoodfacts.service.js ← barcode lookup
  validators/
    auth.validator.js
    workout.validator.js
    food.validator.js
    weight.validator.js
  helpers/
    unitConverter.js      ← kg↔lbs, cm↔ft-in
    calorieCalc.js        ← TDEE, BMR helpers
    streakCalc.js         ← streak logic
  constants/
    exerciseCategories.js
    mealTypes.js
    goalTypes.js
    units.js
  jobs/
    streakReset.job.js    ← daily cron: reset streak if no activity
    cleanup.job.js        ← weekly: delete unverified accounts
  utils/
    logger.js             ← Winston logger
    asyncHandler.js       ← try/catch wrapper
    ApiError.js           ← custom error class
    ApiResponse.js        ← standard response wrapper
  app.js                  ← Express setup, middleware registration
  server.js               ← listen + DB connect
tests/
  auth.test.js
  workout.test.js
  food.test.js
```

---

## Database Schema

### Users

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
fullName        VARCHAR(100) NOT NULL
email           VARCHAR(150) UNIQUE NOT NULL
password        VARCHAR(255) NOT NULL
age             INTEGER
gender          ENUM('male', 'female', 'other')
height          DECIMAL(5,2)            -- stored in cm always
currentWeight   DECIMAL(5,2)            -- stored in kg always
goal            ENUM('fat_loss', 'muscle_gain', 'strength', 'general_fitness')
experienceLevel ENUM('beginner', 'intermediate', 'advanced')
equipment       ENUM('bodyweight', 'dumbbells', 'full_gym', 'bands')
unitSystem      ENUM('metric', 'imperial') DEFAULT 'metric'
avatarUrl       TEXT
currentStreak   INTEGER DEFAULT 0
lastActiveDate  DATE
onboardingComplete BOOLEAN DEFAULT false
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

### RefreshTokens

```sql
id          UUID PRIMARY KEY
userId      UUID REFERENCES Users(id) ON DELETE CASCADE
token       TEXT NOT NULL UNIQUE
expiresAt   TIMESTAMP NOT NULL
createdAt   TIMESTAMP
```

### WorkoutPlans

```sql
id          UUID PRIMARY KEY
userId      UUID REFERENCES Users(id) ON DELETE CASCADE
name        VARCHAR(100) NOT NULL
goal        VARCHAR(50)
daysPerWeek INTEGER
isAiGenerated BOOLEAN DEFAULT false
createdAt   TIMESTAMP
updatedAt   TIMESTAMP
```

### Exercises (global — seeded, not per-user)

```sql
id           UUID PRIMARY KEY
name         VARCHAR(150) NOT NULL
category     ENUM('chest','back','legs','shoulders','arms','core','cardio')
instructions TEXT
videoUrl     TEXT
imageUrl     TEXT
muscleGroup  VARCHAR(100)
difficulty   ENUM('beginner', 'intermediate', 'advanced')
equipment    VARCHAR(100)
createdAt    TIMESTAMP
```

### WorkoutSessions

```sql
id             UUID PRIMARY KEY
userId         UUID REFERENCES Users(id) ON DELETE CASCADE
workoutPlanId  UUID REFERENCES WorkoutPlans(id) ON DELETE SET NULL
date           DATE NOT NULL
durationMins   INTEGER
completed      BOOLEAN DEFAULT false
notes          TEXT
createdAt      TIMESTAMP
```

### ExerciseLogs

```sql
id               UUID PRIMARY KEY
workoutSessionId UUID REFERENCES WorkoutSessions(id) ON DELETE CASCADE
exerciseId       UUID REFERENCES Exercises(id)
sets             INTEGER
reps             INTEGER
weightKg         DECIMAL(6,2)   -- always stored in kg; convert on display
notes            TEXT
setData          JSONB          -- [{set:1, reps:10, weightKg:50, done:true}, ...]
createdAt        TIMESTAMP
```

### FoodLogs

```sql
id          UUID PRIMARY KEY
userId      UUID REFERENCES Users(id) ON DELETE CASCADE
mealName    VARCHAR(200) NOT NULL
mealType    ENUM('breakfast', 'lunch', 'dinner', 'snack')
calories    DECIMAL(7,2)
protein     DECIMAL(6,2)
carbs       DECIMAL(6,2)
fats        DECIMAL(6,2)
imageUrl    TEXT
barcode     VARCHAR(50)
mealDate    DATE NOT NULL
isAiScanned BOOLEAN DEFAULT false
createdAt   TIMESTAMP
```

### WaterLogs

```sql
id        UUID PRIMARY KEY
userId    UUID REFERENCES Users(id) ON DELETE CASCADE
amountMl  INTEGER NOT NULL
date      DATE NOT NULL
loggedAt  TIMESTAMP
```

### WeightLogs

```sql
id        UUID PRIMARY KEY
userId    UUID REFERENCES Users(id) ON DELETE CASCADE
weightKg  DECIMAL(5,2) NOT NULL   -- always kg
note      TEXT
date      DATE NOT NULL
createdAt TIMESTAMP
```

### BodyMeasurements (new)

```sql
id        UUID PRIMARY KEY
userId    UUID REFERENCES Users(id) ON DELETE CASCADE
date      DATE NOT NULL
waistCm   DECIMAL(5,2)
chestCm   DECIMAL(5,2)
hipsCm    DECIMAL(5,2)
armsCm    DECIMAL(5,2)
thighsCm  DECIMAL(5,2)
createdAt TIMESTAMP
```

### ProgressPhotos

```sql
id         UUID PRIMARY KEY
userId     UUID REFERENCES Users(id) ON DELETE CASCADE
imageUrl   TEXT NOT NULL
photoType  ENUM('front', 'side', 'back')
uploadedAt TIMESTAMP
```

### ChatMessages

```sql
id        UUID PRIMARY KEY
userId    UUID REFERENCES Users(id) ON DELETE CASCADE
role      ENUM('user', 'assistant')
content   TEXT NOT NULL
createdAt TIMESTAMP
```

---

## API Endpoints

### Authentication

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout              ← deletes refresh token from DB
POST   /api/auth/refresh-token       ← returns new access token
POST   /api/auth/forgot-password     ← sends reset email via Resend
POST   /api/auth/reset-password      ← verifies token, updates password
GET    /api/auth/profile             ← requires auth
PUT    /api/auth/profile             ← update profile + onboarding data
PATCH  /api/auth/change-password     ← requires current password
DELETE /api/auth/account             ← delete account + all data
```

### Workouts

```
GET    /api/workouts                 ← user's plans list
POST   /api/workouts                 ← create plan
GET    /api/workouts/:id             ← plan detail with exercises
PUT    /api/workouts/:id             ← edit plan
DELETE /api/workouts/:id             ← delete plan
```

### Exercises

```
GET    /api/exercises                ← all exercises (paginated, searchable)
GET    /api/exercises/category/:cat  ← filter by category
GET    /api/exercises/:id            ← exercise detail
GET    /api/exercises/:id/history    ← user's log history for this exercise
```

### Workout Sessions

```
POST   /api/sessions/start           ← creates session, returns session id
PUT    /api/sessions/:id/log-set     ← log a single set
POST   /api/sessions/:id/complete    ← marks session done, updates streak
DELETE /api/sessions/:id             ← discard session
GET    /api/sessions/history         ← paginated session history
GET    /api/sessions/:id             ← session detail with exercise logs
```

### Food

```
POST   /api/food                     ← log food
GET    /api/food?date=YYYY-MM-DD     ← food logs for a date
PUT    /api/food/:id                 ← edit food log
DELETE /api/food/:id
GET    /api/food/barcode/:code       ← lookup via Open Food Facts (proxy)
```

### Water

```
POST   /api/water                    ← log water
GET    /api/water?date=YYYY-MM-DD    ← water logs for a date
DELETE /api/water/:id
```

### Weight

```
POST   /api/weight                   ← log weight
GET    /api/weight?range=weekly|monthly|yearly
PUT    /api/weight/:id
DELETE /api/weight/:id
```

### Body Measurements

```
POST   /api/measurements
GET    /api/measurements?range=monthly|yearly
PUT    /api/measurements/:id
DELETE /api/measurements/:id
```

### Progress Photos

```
POST   /api/progress/photos          ← upload (Cloudinary)
GET    /api/progress/photos          ← list with pagination
DELETE /api/progress/photos/:id
```

### Dashboard

```
GET    /api/dashboard                ← today's summary (Redis cached, 5min TTL)
GET    /api/dashboard/streak         ← last 90 days activity grid
GET    /api/dashboard/streak/current ← current streak + longest streak
```

### AI Endpoints

```
POST   /api/ai/meal-scan             ← upload image → Gemini → macros
POST   /api/ai/generate-workout      ← Gemini → structured plan
POST   /api/ai/chat                  ← chat with coach (stores history)
GET    /api/ai/chat/history          ← paginated chat history
DELETE /api/ai/chat/history          ← clear chat history
```

### Data Export

```
GET    /api/export/all               ← returns zip of all CSVs
GET    /api/export/food              ← food logs CSV
GET    /api/export/workouts          ← workout sessions CSV
GET    /api/export/weight            ← weight logs CSV
```

---

## AI Implementation Details

### Gemini 1.5 Flash — Use This Model

```javascript
// config/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Always use flash — it's free and fast enough for all fitness tasks
export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});
```

### Meal Scan Flow

1. Receive image via Multer (max 5MB, MIME check: image/jpeg or image/png only)
2. Resize to max 1200px width using Sharp (cuts Cloudinary bandwidth)
3. Upload resized image to Cloudinary
4. Send Cloudinary URL to Gemini with structured prompt
5. Parse JSON response
6. Return structured result

Gemini prompt for meal scan:

```
You are a nutrition expert. Analyze this meal image and return ONLY a valid JSON object.
No explanation, no markdown, no extra text. Just the JSON.

{
  "mealName": "string",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "confidence": "high|medium|low"
}

If you cannot identify the food, return confidence "low" with estimated values.
```

### Workout Generator Flow

Input:

```json
{
  "goal": "muscle_gain",
  "experience": "intermediate",
  "daysPerWeek": 5,
  "equipment": "full_gym"
}
```

Gemini prompt returns structured JSON with plan name, split type, and daily exercise arrays. Parse and save as `WorkoutPlan` + associated exercises.

### AI Chat Flow

1. Load last 10 messages from `ChatMessages` for context
2. Build context string: user profile (goal, weight, experience) + recent 3 days of logs
3. Send to Gemini with system context
4. Save user message + assistant reply to `ChatMessages`
5. Return reply

System context template:

```
You are a personal AI fitness coach. Here is your client's profile:
- Goal: {goal}, Experience: {experience}, Weight: {weight}kg
- Today's calories logged: {calories} / {calorieGoal}
- Today's protein: {protein}g
- Last workout: {lastWorkoutDate}

Respond in a friendly, motivating tone. Keep answers concise (under 150 words unless asked for detail).
```

---

## Authentication Flow

### Access Token

- JWT, 15-minute expiry
- Payload: `{ userId, email, iat, exp }`
- Sent in `Authorization: Bearer <token>` header

### Refresh Token

- UUID stored in `RefreshTokens` table
- 7-day expiry
- Sent in HttpOnly cookie
- On refresh: validate token in DB, issue new access token, rotate refresh token (delete old, insert new)

### Password Reset

- Generate 6-digit OTP or signed URL token (expires 15 minutes)
- Send via Resend email service
- Store hashed token in Redis with 15-min TTL
- On reset: verify token from Redis, update password, delete token

---

## Middleware Details

### Rate Limiting (express-rate-limit)

```javascript
// Auth routes: strict
authLimiter: 5 requests / 15 minutes per IP

// AI routes: protect Gemini quota
aiLimiter: 10 requests / 1 hour per userId

// General API: generous
apiLimiter: 100 requests / 15 minutes per userId
```

### File Upload Validation (Multer + Sharp)

```javascript
// Allowed MIME types (check actual buffer, not extension)
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

// Max file size
const maxSize = 5 * 1024 * 1024; // 5MB

// Sharp processing before Cloudinary
const processed = await sharp(buffer)
  .resize({ width: 1200, withoutEnlargement: true })
  .jpeg({ quality: 80 })
  .toBuffer();
```

### Error Handler

All errors flow through a single `errorHandler` middleware. Use a custom `ApiError` class:

```javascript
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
  }
}
```

Standard response wrapper:

```javascript
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
```

---

## Streak Logic

Streak is updated after any of these actions:

- Completing a workout session
- Logging at least one meal
- Logging water

Rules:

- A day counts as "active" if any one of the above happened
- `currentStreak` increments if `lastActiveDate` was yesterday
- `currentStreak` resets to 1 if `lastActiveDate` was before yesterday
- A daily cron job (node-cron) runs at midnight: users with `lastActiveDate` before today keep their streak frozen until they act (streak doesn't reset mid-day)

Store on User model:

- `currentStreak` — integer
- `lastActiveDate` — date
- `longestStreak` — integer (add this field)

---

## Caching Strategy (Upstash Redis)

| Key                        | TTL      | Invalidated when               |
| -------------------------- | -------- | ------------------------------ |
| `dashboard:{userId}`       | 5 min    | Any food/water/workout log     |
| `streak:{userId}`          | 10 min   | Session completed, food logged |
| `exercises:all`            | 24 hours | Admin re-seeds                 |
| `exercises:cat:{category}` | 24 hours | Admin re-seeds                 |

---

## Exercise Seeder

Use the `wger.de` free REST API to seed exercises:

```javascript
// seeders/exercises.seeder.js
// GET https://wger.de/api/v2/exercise/?format=json&language=2&limit=100&offset=0
// language=2 is English
// Loop through all pages and insert into Exercises table
// Map wger categories to your ENUM values
// Target: 200+ exercises across all categories
```

---

## Security Checklist

- [x] `helmet` — sets 14 security headers automatically
- [x] `cors` — whitelist only your Vercel frontend URL
- [x] JWT with short expiry (15 min) + refresh token rotation
- [x] Passwords hashed with bcrypt (salt rounds: 12)
- [x] Input validation on every route (Express Validator)
- [x] Parameterized queries via Sequelize (no raw SQL injection risk)
- [x] MIME type validation on file uploads (not just extension)
- [x] Rate limiting on auth + AI routes
- [x] Refresh tokens stored in DB (can be revoked)
- [x] HttpOnly cookies for refresh token
- [x] Winston error logging (never expose stack traces in production)
- [x] `NODE_ENV=production` disables verbose error messages
- [x] All user data scoped by `userId` on every query

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database (Neon)
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# JWT
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Gemini (free tier)
GEMINI_API_KEY=your_google_ai_studio_key

# Resend (email)
RESEND_API_KEY=
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.vercel.app
```

---

## Deployment

### Backend — Render (free tier)

- Connect GitHub repo
- Build command: `npm install`
- Start command: `node server.js`
- Set all environment variables in Render dashboard
- Note: free tier sleeps after 15 minutes of inactivity (first request takes ~30s to wake). Acceptable for portfolio; upgrade to $7/month for always-on.

### Database — Neon PostgreSQL (free tier)

- Create project at neon.tech
- Copy connection string to `DATABASE_URL`
- Enable connection pooling (PgBouncer) in Neon dashboard
- Run `npx sequelize-cli db:migrate` then `npx sequelize-cli db:seed:all`

### Storage — Cloudinary (free tier)

- 25 GB storage + 25 GB bandwidth per month
- Create upload presets for: `meal_images`, `progress_photos`, `avatars`
- Enable auto-format and auto-quality in upload preset

### AI — Google Gemini (free tier)

- Get API key from Google AI Studio (aistudio.google.com) — no billing required
- Free quota: 1 million tokens/month for Gemini 1.5 Flash
- Quota resets monthly
- No credit card required for free tier

### Email — Resend (free tier)

- 3,000 emails/month free
- Verify your sending domain or use their sandbox for development
