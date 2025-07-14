# Sakthi Spark Backend API

A robust Node.js/Express backend API for the Sakthi Spark continuous improvement platform with MongoDB integration.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Idea Management**: CRUD operations for employee improvement ideas
- **Credit Points System**: Automated calculation and tracking of user points
- **Notification System**: Real-time notifications for status changes and milestones
- **File Upload**: Support for image uploads with validation
- **SMS Integration**: Twilio integration for OTP verification
- **Leaderboard**: User ranking based on credit points
- **Achievement System**: Milestone tracking and notifications

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login with OTP verification
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/leaderboard` - Get leaderboard
- `POST /api/users/recalculate-credit-points` - Recalculate all users' credit points (Admin)
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (admin only)

### Ideas
- `GET /api/ideas` - Get all ideas (with filters)
- `POST /api/ideas` - Submit new idea (+10 points)
- `GET /api/ideas/my` - Get user's own ideas
- `PUT /api/ideas/:id/status` - Update idea status (+20/+30 points)
- `PUT /api/ideas/:id` - Update idea details
- `DELETE /api/ideas/:id` - Delete idea (recalculate points)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configurations
   ```

4. **Database Setup**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sakthi-spark
JWT_SECRET=your_jwt_secret_here
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

## Database Schema

### User Model
```javascript
{
  employeeNumber: String,
  name: String,
  email: String,
  department: String,
  role: String,
  creditPoints: Number,
  achievements: Array,
  createdAt: Date
}
```

### Idea Model
```javascript
{
  title: String,
  description: String,
  category: String,
  submittedBy: ObjectId,
  status: String,
  reviewComments: String,
  approvedBy: ObjectId,
  approvedAt: Date,
  implementedAt: Date,
  createdAt: Date
}
```

### Notification Model
```javascript
{
  userId: ObjectId,
  title: String,
  message: String,
  type: String,
  isRead: Boolean,
  createdAt: Date
}
```

## Credit Points System

The platform features an automated credit points system:

### Points Allocation
- **Idea Submission**: +10 points per submitted idea
- **Idea Approval**: +20 points per approved idea
- **Idea Implementation**: +30 points per implemented idea

### Milestone Achievements
- First idea submitted
- 5/10/25/50 ideas submitted
- First idea approved
- 5/10/25 ideas approved
- First idea implemented
- 100/500/1000 credit points reached

## Test Data

The seeding script creates sample users:

| Employee Number | OTP | Role | Description |
|----------------|-----|------|-------------|
| 12345 | 1234 | Employee | Regular employee user |
| 67890 | 1234 | Reviewer | Reviewer with approval rights |
| 11111 | 1234 | Admin | Admin User - Sakthi Spark Coordinator |

## Development

```bash
# Start with nodemon for development
npm run dev

# Run tests
npm test

# Seed database
npm run seed

# Reset database
npm run reset-db
```

## Production Deployment

1. **Set up MongoDB Atlas**
   ```bash
   # Update MONGODB_URI in .env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sakthi-spark
   ```

2. **Configure environment variables**
   - Set production JWT_SECRET
   - Configure Twilio credentials
   - Set appropriate PORT

3. **Deploy to your preferred platform**
   - Heroku
   - Vercel
   - AWS
   - DigitalOcean

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Role-based access control
- Rate limiting on API endpoints
- CORS configuration

## Error Handling

The API includes comprehensive error handling:

- Validation errors with detailed messages
- Authentication and authorization errors
- Database connection errors
- File upload errors
- SMS service errors

## Monitoring and Logging

- Request/response logging
- Error logging with stack traces
- Performance monitoring
- Database query logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.