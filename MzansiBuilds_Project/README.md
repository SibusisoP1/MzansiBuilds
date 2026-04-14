# MzansiBuilds - South African Developer Projects Platform

A modern web application built with React, TypeScript, and Firebase that connects South African developers and showcases their completed projects.

## 🚀 Features

- **Project Management**: Create, edit, and track development projects
- **Real-time Feed**: Stay updated with latest developer activities
- **Celebration Wall**: Showcase and celebrate completed projects
- **Developer Profiles**: Connect with other South African developers
- **Collaboration Requests**: Request to collaborate on interesting projects
- **Authentication**: Secure user registration and login system
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Firebase (Firestore Database + Authentication)
- **Styling**: CSS with custom green/white/black theme
- **Build Tool**: Vite
- **Package Manager**: npm

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mzansibuilds.git
cd mzansibuilds
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

**⚠️ Important**: You need to set up your own Firebase project for the app to work.

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: `mzansibuilds`
4. Enable Google Analytics (recommended)
5. Click "Create project"

#### Step 2: Enable Authentication
1. In Firebase Console, go to **Authentication** > **Get started**
2. Enable **Email/Password** provider
3. Optionally enable **Google** provider for OAuth

#### Step 3: Set Up Firestore
1. Go to **Firestore Database** > **Create database**
2. Choose location nearest to your users
3. Start in **test mode**
4. Choose a location for your default Cloud Firestore

#### Step 4: Get Firebase Configuration
1. Go to **Project Settings** > **General** > **Your apps**
2. Click web app icon (`</>`)
3. App nickname: `mzansibuilds-web`
4. Click "Register app"
5. Copy the firebaseConfig object

#### Step 5: Configure Your Firebase
1. Copy `src/firebase-config.example.ts` to `src/firebase-config.ts`
2. Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id" // Optional
};
```

#### Step 6: Set Up Firestore Security Rules
Go to **Firestore Database** > **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read projects, but only authenticated users can create
    // Users can only update their own projects
    match /projects/{projectId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Feed activities
    match /feed_activities/{activityId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
  }
}
```

### 4. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
mzansibuilds/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   ├── contexts/          # React contexts (Auth, etc.)
│   ├── pages/            # Page components
│   ├── services/          # API services (Firebase)
│   ├── types/            # TypeScript type definitions
│   ├── firebase-config.ts  # Firebase configuration (create from example)
│   └── main.tsx          # App entry point
├── .gitignore           # Git ignore file
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Development

### Adding New Features

1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Update types in `src/types/`
4. Add API methods in `src/services/firebase-api.ts`

### Code Style

- Use TypeScript for type safety
- Follow React functional component patterns
- Use Firebase API for all data operations
- Maintain the green/white/black theme

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Deploy to Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase Hosting: `firebase init hosting`
4. Deploy: `firebase deploy`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **"Permission denied" errors**:
   - Check Firestore security rules
   - Ensure user is authenticated

2. **"No such document" errors**:
   - Verify collection names match exactly
   - Check document structure

3. **Authentication errors**:
   - Ensure Email/Password provider is enabled
   - Verify Firebase config values are correct

4. **Build errors**:
   - Run `npm run build` to check for TypeScript errors
   - Verify all imports are correct

### Support

- 📖 Documentation: See `FIREBASE_SETUP.md` for detailed setup
- 🐛 Issues: Report bugs on GitHub Issues

## 🙏 Acknowledgments

- Firebase for the amazing backend services
- React team for the excellent frontend framework
- South African developer community for inspiration

---

**Built with ❤️ for South African developers**
