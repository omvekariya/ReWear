# ReWear - Community Clothing Exchange Platform

A full-stack web application that enables users to exchange unused clothing through direct swaps or a point-based redemption system. Built with React, TypeScript, Node.js, Express, and MongoDB.

## 🌟 Features

### User Features
- **Authentication & Profiles**
  - Email/password registration and login
  - User profiles with avatars and bios
  - Points system for clothing redemption
  - Achievement tracking

- **Item Management**
  - Upload clothing items with multiple images
  - Detailed item descriptions and categorization
  - Like and report system
  - Item status tracking

- **Swap System**
  - Direct item-to-item swaps
  - Point-based item redemption
  - Swap request management
  - Shipping tracking
  - Rating and review system
  - Dispute resolution

- **Community Features**
  - Browse and search items
  - User profiles and item history
  - Community leaderboards
  - Social interactions

### Admin Features
- **User Management**
  - Approve/reject user registrations
  - Manage user status and roles
  - View user statistics

- **Content Moderation**
  - Approve/reject item listings
  - Handle reported items
  - Feature quality items
  - Resolve disputes

- **Platform Analytics**
  - Dashboard with key metrics
  - User and item statistics
  - Swap activity monitoring

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Multer + Cloudinary
- **Validation**: Express-validator
- **Security**: bcryptjs, helmet, cors

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Cloudinary account (for image uploads)
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd swap-circle-closet
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
```

Edit the `.env` file with your configuration:
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

### 3. Frontend Setup

```bash
# Navigate back to root and install frontend dependencies
cd ..
npm install

# Set up environment variables
cp .env.example .env.local
```

Edit the `.env.local` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start the Application

```bash
# Terminal 1: Start the backend
cd backend
npm run dev

# Terminal 2: Start the frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 📁 Project Structure

```
swap-circle-closet/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── lib/               # Utilities and API client
│   ├── hooks/             # Custom React hooks
│   └── assets/            # Static assets
├── backend/               # Backend source code
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── server.js          # Main server file
├── public/                # Public assets
└── README.md              # This file
```

## 🔧 Development

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Backend:**
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests

### API Documentation

The backend provides a comprehensive REST API with the following endpoints:

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

#### Items
- `GET /api/items` - Get all items (with filtering)
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get single item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

#### Swaps
- `GET /api/swaps` - Get user's swaps
- `POST /api/swaps` - Create swap request
- `PUT /api/swaps/:id/accept` - Accept swap
- `PUT /api/swaps/:id/reject` - Reject swap

#### Admin
- `GET /api/admin/stats` - Get admin dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/items` - Get all items
- `PUT /api/admin/items/:id/approve` - Approve item

For complete API documentation, see the [backend README](./backend/README.md).

## 🔒 Security Features

- **Authentication**: JWT-based authentication with secure token handling
- **Authorization**: Role-based access control (User/Admin)
- **Input Validation**: Comprehensive validation on all endpoints
- **Rate Limiting**: Protection against abuse
- **CORS**: Configured for secure cross-origin requests
- **File Upload**: Secure image upload with size and type restrictions
- **Password Security**: bcrypt hashing for all passwords

## 🚀 Deployment

### Backend Deployment

1. **Environment Setup**
   - Set production environment variables
   - Configure MongoDB Atlas or similar
   - Set up Cloudinary for image storage

2. **Deploy to Platform**
   ```bash
   # Example for Heroku
   heroku create your-app-name
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-uri
   git push heroku main
   ```

### Frontend Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Deploy to Platform**
   - Vercel: Connect GitHub repository
   - Netlify: Drag and drop `dist` folder
   - AWS S3: Upload `dist` contents

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Review the documentation in the `backend/README.md` file

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Cloudinary](https://cloudinary.com/) for image management
- [MongoDB](https://www.mongodb.com/) for the database

---

**Happy swapping! 🌱♻️**
