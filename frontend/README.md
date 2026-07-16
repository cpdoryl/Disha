# Disha v2.0 - Frontend

A modern, production-ready education management system frontend built with Next.js 14, TypeScript, React Hook Form, and Tailwind CSS.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Authentication**: JWT-based authentication with secure token management
- **State Management**: Zustand for global state with persistence
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Responsive, accessible components
- **Dashboard**: Role-based dashboards (Admin, School Admin, Teacher, Student, Parent)
- **Data Visualization**: Recharts for analytics and charts
- **API Integration**: Axios with interceptors for backend communication

## 📦 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Login page
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components (Navbar, Sidebar)
│   └── dashboard/        # Dashboard components
├── lib/
│   ├── api/              # API client and services
│   ├── store/            # Zustand stores
│   └── hooks/            # Custom React hooks
├── types/                # TypeScript type definitions
├── public/               # Static assets
└── .env.local           # Environment variables
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Create environment file**:
```bash
cp .env.example .env.local
```

3. **Update API URL** (if needed):
Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🚀 Development

### Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production
```bash
npm run build
npm start
```

### Type Check
```bash
npm run type-check
```

### Format Code
```bash
npm run format
```

## 📚 Pages & Components

### Authentication
- **Login Page** (`/`): Email/password authentication
- **Auth Store**: Zustand store for auth state management

### Dashboard
- **Home** (`/dashboard`): Overview with stats and charts
- **Navigation**: Sidebar navigation with role-based menu items

### Layouts
- **Root Layout**: Global styling and structure
- **Dashboard Layout**: Protected route with navbar and sidebar
- **Navbar**: User info and logout
- **Sidebar**: Role-based navigation

## 🔐 Authentication Flow

1. User enters credentials on login page
2. API client sends POST request to `/api/v2/auth/login`
3. Backend returns JWT token
4. Token stored in cookies via js-cookie
5. Token auto-included in all API requests via interceptors
6. 401 responses trigger automatic logout

## 📊 API Integration

All API requests go through the centralized client:

```typescript
import client from '@/lib/api/client'

// GET request
const response = await client.get('/api/v2/users')

// POST request
const response = await client.post('/api/v2/auth/login', {
  email: 'user@example.com',
  password: 'password123',
})
```

## 🎯 Available Routes

### Public
- `/` - Login page

### Protected (Authenticated Users)
- `/dashboard` - Main dashboard
- `/dashboard/users` - User management
- `/dashboard/schools` - School management
- `/dashboard/students` - Student management
- `/dashboard/staff` - Staff management
- `/dashboard/classes` - Class management
- `/dashboard/assessments` - Assessment management
- `/dashboard/attendance` - Attendance tracking
- `/dashboard/reports` - Reports and analytics

## 🧪 Testing

### Unit Tests (Coming Soon)
```bash
npm run test
```

### E2E Tests (Coming Soon)
```bash
npm run test:e2e
```

## 📦 Dependencies

### Core
- `next@^14.0.0` - React framework
- `react@^18.2.0` - UI library
- `typescript@^5.3.0` - Type safety

### Forms & Validation
- `react-hook-form@^7.48.0` - Form management
- `zod@^3.22.0` - Schema validation
- `@hookform/resolvers@^3.3.0` - Validation resolvers

### State Management
- `zustand@^4.4.0` - Lightweight state management

### UI & Styling
- `tailwindcss@^3.3.6` - Utility-first CSS
- `@radix-ui/*` - Accessible UI components
- `recharts@^2.10.0` - Data visualization

### API & Utilities
- `axios@^1.6.0` - HTTP client
- `js-cookie@^3.0.5` - Cookie management
- `date-fns@^2.30.0` - Date utilities

## 🚀 Next Steps

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build more pages and components
4. Connect to backend API
5. Implement user management features
6. Add student/assessment management
7. Create reporting dashboards
8. Deploy to production

## 📝 Environment Variables

```
NEXT_PUBLIC_API_URL    # Backend API URL (public)
NODE_ENV              # Development/Production
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

© 2026 Disha. All rights reserved.

## 📞 Support

For issues or questions, please contact the development team.
