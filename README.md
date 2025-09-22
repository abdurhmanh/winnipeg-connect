# 🏠 Winnipeg Connect

A full-stack marketplace web application connecting service providers and service seekers in Winnipeg, Manitoba.

## 🌟 Features

### 🔐 **Authentication & User Management**
- Role-based authentication (Service Seekers & Service Providers)
- JWT token authentication with Firebase integration
- Secure user registration and login

### 📋 **Job Management**
- Post detailed job requests with budgets and timelines
- Browse available jobs with advanced filtering
- Submit and manage competitive quotes
- Job categorization and search functionality

### 👥 **Service Provider Discovery**
- Advanced search and filtering system
- Browse providers by category, rating, and location
- Detailed provider profiles with ratings and reviews
- Service-specific search capabilities

### 💬 **Real-time Communication**
- In-app messaging system
- Socket.io powered real-time chat
- Communication between seekers and providers

### 🗺️ **Location Services**
- Google Maps integration for job locations
- Interactive maps showing service areas
- Location-based provider discovery
- Winnipeg-focused service areas

### 💳 **Payment Integration**
- Stripe payment processing (ready for implementation)
- Escrow payment system for secure transactions
- Transaction history and management

## 🚀 **Technology Stack**

### **Frontend**
- **React 18** with TypeScript
- **Material-UI** for modern UI components
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Socket.io Client** for real-time features

### **Backend**
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** authentication
- **Firebase Admin SDK**
- **Stripe SDK** for payments
- **Cloudinary** for file uploads

### **Development & Deployment**
- **TypeScript** for type safety
- **Vercel** deployment configuration
- **Git** version control
- **npm** package management

## 🛠️ **Installation & Setup**

### **Prerequisites**
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (optional for MVP)
- Git

### **Quick Start**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/winnipeg-connect.git
   cd winnipeg-connect
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp server/.env.example server/.env
   ```
   
   Edit `server/.env` with your configuration:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   
   # Firebase (optional)
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY=your_private_key
   FIREBASE_CLIENT_EMAIL=your_client_email
   
   # Cloudinary (optional)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Stripe (optional)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # Google Maps (optional)
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Start the application**
   ```bash
   # Development mode (runs both client and server)
   npm run dev
   
   # Or start individually
   # Backend: http://localhost:5001
   cd server && npm start
   
   # Frontend: http://localhost:3000
   cd client && npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001/api/health

## 📱 **Usage**

### **For Service Seekers**
1. Register and select "I Need Services"
2. Post job requests with detailed requirements
3. Browse and search service providers
4. Compare quotes and communicate with providers
5. Manage projects and leave reviews

### **For Service Providers**
1. Register and select "I Provide Services"
2. Browse available job opportunities
3. Submit competitive quotes
4. Communicate with potential customers
5. Manage your profile and showcase services

## 🏗️ **Project Structure**

```
winnipeg-connect/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store
│   │   └── theme/         # Material-UI theme
│   └── package.json
├── server/                # Express backend
│   ├── config/           # Configuration files
│   ├── middleware/       # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── scripts/         # Database scripts
├── .gitignore
├── package.json         # Root package.json
├── vercel.json         # Deployment config
└── README.md
```

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### **Users**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/providers` - Get service providers

### **Jobs**
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get specific job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### **Quotes**
- `GET /api/quotes` - Get quotes
- `POST /api/quotes` - Submit quote
- `PUT /api/quotes/:id` - Update quote

### **Messages**
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message

## 🚀 **Deployment**

### **Quick Deploy to Vercel**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/abdurhmanh/winnipeg-connect&project-name=winnipeg-connect&repository-name=winnipeg-connect)

### **Manual Vercel Deployment**
1. Connect your GitHub repository to Vercel
2. Set Root Directory to `client`
3. Configure environment variables in Vercel dashboard
4. Deploy with automatic CI/CD

### **Live Demo**
- **Frontend:** [https://winnipeg-connect.vercel.app](https://winnipeg-connect.vercel.app)
- **API Health:** [https://winnipeg-connect-api.vercel.app/api/health](https://winnipeg-connect-api.vercel.app/api/health)

### **Manual Deployment**
```bash
# Build the client
cd client
npm run build

# Deploy to your hosting platform
```

## 🧪 **Testing**

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 **Support**

For support and questions:
- Create an issue on GitHub
- Email: support@winnipegconnect.com

## 🎯 **Roadmap**

- [ ] Advanced payment processing with Stripe
- [ ] Real Google Maps integration
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Advanced notification system

---

**Built with ❤️ for the Winnipeg community**