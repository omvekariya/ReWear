# ReWear Backend API

A comprehensive backend API for the ReWear clothing exchange platform, built with Node.js, Express, and MongoDB.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Password reset functionality
  - Email verification (optional)

- **Item Management**
  - CRUD operations for clothing items
  - Image upload with Cloudinary
  - Item approval workflow
  - Search and filtering
  - Like and report system

- **Swap System**
  - Direct item swaps
  - Point-based redemption
  - Swap request management
  - Shipping tracking
  - Rating system
  - Dispute resolution

- **Admin Panel**
  - User management
  - Item moderation
  - Swap oversight
  - Dispute resolution
  - Platform statistics

- **Security Features**
  - Input validation
  - Rate limiting
  - CORS protection
  - Helmet security headers
  - Password hashing

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Multer + Cloudinary
- **Validation**: Express-validator
- **Security**: bcryptjs, helmet, cors

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Cloudinary account (for image uploads)

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/rewear

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # CORS Configuration
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/logout` - Logout

### Items
- `GET /api/items` - Get all items (with filtering)
- `GET /api/items/featured` - Get featured items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/:id/like` - Toggle like
- `POST /api/items/:id/report` - Report item
- `GET /api/items/user/:userId` - Get user's items

### Swaps
- `GET /api/swaps` - Get user's swaps
- `GET /api/swaps/pending` - Get pending swaps
- `GET /api/swaps/:id` - Get single swap
- `POST /api/swaps` - Create swap request
- `PUT /api/swaps/:id/accept` - Accept swap
- `PUT /api/swaps/:id/reject` - Reject swap
- `PUT /api/swaps/:id/ship` - Mark as shipped
- `PUT /api/swaps/:id/receive` - Mark as received
- `POST /api/swaps/:id/rate` - Rate swap
- `POST /api/swaps/:id/dispute` - Raise dispute

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/items` - Get user's items
- `GET /api/users/:id/swaps` - Get user's swaps
- `PUT /api/users/profile` - Update profile
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users/search` - Search users
- `GET /api/users/top` - Get top users

### Admin
- `GET /api/admin/stats` - Get admin dashboard stats
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/items` - Get all items
- `PUT /api/admin/items/:id/approve` - Approve item
- `PUT /api/admin/items/:id/reject` - Reject item
- `PUT /api/admin/items/:id/feature` - Feature item
- `GET /api/admin/items/flagged` - Get flagged items
- `PUT /api/admin/items/:id/resolve-reports` - Resolve reports
- `GET /api/admin/swaps` - Get all swaps
- `GET /api/admin/disputes` - Get disputes
- `PUT /api/admin/swaps/:id/resolve-dispute` - Resolve dispute

### Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `DELETE /api/upload/image/:publicId` - Delete image
- `POST /api/upload/avatar` - Upload avatar

## Database Models

### User
- Basic info (name, email, password)
- Profile (avatar, bio)
- Points system
- Role and status
- Preferences and stats

### Item
- Item details (title, description, category, size, etc.)
- Images with Cloudinary integration
- Points value
- Status and approval workflow
- Likes and reports

### Swap
- Swap participants and items
- Status tracking
- Shipping information
- Rating system
- Dispute handling

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment | No | development |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRE` | JWT expiration time | No | 7d |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes | - |
| `FRONTEND_URL` | Frontend URL for CORS | No | http://localhost:5173 |

## Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests

### Code Structure
```
backend/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── server.js        # Main server file
├── package.json     # Dependencies
└── README.md        # This file
```

### API Response Format
All API responses follow a consistent format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Input validation on all endpoints
- Rate limiting to prevent abuse
- CORS protection
- Security headers with Helmet
- File upload restrictions

## Deployment

1. Set up environment variables for production
2. Use a process manager like PM2
3. Set up MongoDB Atlas or similar
4. Configure Cloudinary for image storage
5. Set up proper CORS origins
6. Use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 