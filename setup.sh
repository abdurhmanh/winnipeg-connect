#!/bin/bash

echo "🚀 Setting up Winnipeg Connect..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..

echo "✅ Dependencies installed successfully!"

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "📝 Creating environment file..."
    cp server/env.example server/.env
    echo "⚠️  Please update server/.env with your actual credentials before running the app."
    echo "   You'll need:"
    echo "   - MongoDB connection string"
    echo "   - JWT secret key"
    echo "   - Stripe keys (optional for MVP)"
    echo "   - Cloudinary credentials (optional for MVP)"
    echo ""
fi

echo "🎉 Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Update server/.env with your credentials"
echo "2. Run 'npm run dev' to start both frontend and backend"
echo "3. Visit http://localhost:3000 to see the app"
echo ""
echo "📚 Optional: Run 'cd server && npm run seed' to add sample data"
echo ""
echo "🏃‍♂️ Quick start: npm run dev"
