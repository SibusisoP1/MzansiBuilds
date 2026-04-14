# Firebase Setup Instructions for MzansiBuilds

## Step 1: Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Click "Add project"**
3. **Project name**: `mzansibuilds`
4. **Enable Google Analytics**: Recommended
5. **Click "Create project"**

## Step 2: Configure Authentication

1. **In Firebase Console**, go to **Authentication** > **Get started**
2. **Enable Email/Password**:
   - Click "Email/Password" 
   - Enable "Email/Password" provider
   - Click "Save"
3. **Optional**: Enable Google provider for OAuth

## Step 3: Set Up Firestore Database

1. **Go to Firestore Database** > **Create database**
2. **Choose location**: Select nearest to your users
3. **Start in test mode** (we'll add security rules later)
4. **Choose a location** for your default Cloud Firestore location

## Step 4: Get Firebase Configuration

1. **Go to Project Settings** > **General** > **Your apps**
2. **Click web app icon** (`</>`)
3. **App nickname**: `mzansibuilds-web`
4. **Click "Register app"**
5. **Copy the firebaseConfig object** - you'll need this

## Step 5: Update Your Firebase Config

Replace the placeholder config in `src/firebase-config.ts` with your actual config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "mzansibuilds.firebaseapp.com",
  projectId: "mzansibuilds",
  storageBucket: "mzansibuilds.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 6: Set Up Firestore Collections

Your app will automatically create these collections, but you can set them up manually:

### Users Collection
```
Collection: users
Fields:
- username (string)
- email (string)
- avatar (string)
- bio (string)
- skills (string)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Projects Collection
```
Collection: projects
Fields:
- user_id (string)
- title (string)
- description (string)
- stage (string)
- support_required (string)
- github_url (string)
- demo_url (string)
- status (string)
- created_at (timestamp)
- updated_at (timestamp)
- username (string)
- avatar (string)
- total_milestones (number)
- completed_milestones (number)
```

### Feed Activities Collection
```
Collection: feed_activities
Fields:
- user_id (string)
- project_id (string)
- activity_type (string)
- description (string)
- created_at (timestamp)
- username (string)
- avatar (string)
```

## Step 7: Set Up Firestore Security Rules

Go to **Firestore Database** > **Rules** and replace with:

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
    
    // Feed activities - similar rules
    match /feed_activities/{activityId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
  }
}
```

## Step 8: Switch to Firebase API

Replace mock API imports with Firebase API in these files:

### Files to update:
- `src/pages/Projects.tsx`
- `src/pages/ProjectDetail.tsx`
- `src/pages/Feed.tsx`
- `src/pages/CreateProject.tsx`
- `src/pages/EditProject.tsx`
- `src/pages/Celebration.tsx`

### Change this:
```typescript
import { mockProjectAPI } from "../services/mock-api";
```

### To this:
```typescript
import { firebaseProjectAPI } from "../services/firebase-api";
```

And:
```typescript
import { mockFeedAPI } from "../services/mock-api";
```

### To this:
```typescript
import { firebaseFeedAPI } from "../services/firebase-api";
```

## Step 9: Update Auth Context

Make sure your `src/contexts/AuthContext.tsx` uses Firebase API:

```typescript
// In the login function:
const result = await firebaseAuthAPI.login({ email, password });

// In the register function:
const result = await firebaseAuthAPI.register({ username, email, password });

// In the logout function:
await firebaseAuthAPI.signOut();
```

## Step 10: Test Your Setup

1. **Run your app**: `npm run dev`
2. **Test registration**: Create a new account
3. **Test login**: Sign in with your new account
4. **Create a project**: Verify it saves to Firestore
5. **Check the feed**: Verify activities appear

## Troubleshooting

### Common Issues:

1. **"Permission denied" errors**:
   - Check Firestore security rules
   - Make sure user is authenticated

2. **"No such document" errors**:
   - Check collection names match exactly
   - Verify document structure

3. **Authentication errors**:
   - Ensure Email/Password provider is enabled
   - Check Firebase config values are correct

4. **Build errors**:
   - Run `npm run build` to check for TypeScript errors
   - Verify all imports are correct

### Debug Tools:

1. **Firebase Console**: Check data in Firestore
2. **Browser DevTools**: Check Network tab for API calls
3. **Console**: Look for Firebase error messages

## Next Steps

Once Firebase is working:
1. Add real-time updates with Firestore listeners
2. Implement file storage for project images
3. Add more authentication providers (Google, GitHub)
4. Set up Firebase Hosting for deployment

## Support

- Firebase Documentation: https://firebase.google.com/docs
- React Firebase: https://firebase.google.com/docs/web/setup
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
