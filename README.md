# F2M Smart POS System

A comprehensive restaurant Point of Sale (POS) system built with modern web technologies, designed to streamline restaurant operations with an intuitive interface and powerful management features.

## 🚀 Live Demo

[View Live Demo on Vercel](#) *(Link will be added after deployment)*

## ✨ Features

### Point of Sale (POS)
- Real-time order management and cart system
- Product grid with categories and search
- Order status tracking (Pending, Preparing, Ready, Served)
- Receipt printing support
- Shift timer and management

### Manager Dashboard
- **Analytics**: Revenue charts, order statistics, and performance metrics
- **Menu Management**: Add, edit, and delete menu items with images
- **Inventory Control**: Track stock levels and product availability
- **Shift Management**: Open/close shifts with revenue tracking
- **Role-Based Access**: Separate interfaces for POS operators and managers

### Technical Features
- **Authentication**: Secure login system with NextAuth.js
- **Database**: SQLite with Drizzle ORM for efficient data management
- **Offline Support**: Service Worker for offline functionality
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Real-time Updates**: React state management with Zustand

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, CVA (Class Variance Authority)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: NextAuth.js v4
- **State Management**: Zustand
- **Charts**: Recharts for analytics
- **Testing**: Vitest, React Testing Library

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mayar471/F2M-Smart-POS-System.git
   cd f2m-smart-pos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Initialize the database**
   ```bash
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 🏗️ Building for Production

```bash
npm run build
npm start
```

## 🌐 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com/new)
3. Vercel will automatically detect Next.js and configure the build
4. Add environment variables in Vercel dashboard
5. Deploy!

### Other Platforms
This Next.js application can be deployed to any platform that supports Node.js, including:
- Netlify
- Railway
- Render
- AWS Amplify

## 📱 Default Credentials

After running the database seed, you can log in with:
- **Username**: `admin`
- **Password**: `admin123`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

For questions or feedback, please open an issue on GitHub.
