import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase-config";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Get user data from Firestore
        const userQuery = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userQuery.exists()) {
          const userData = userQuery.data() as User;
          setUser({
            id: parseInt(userQuery.id),
            username: userData.username,
            email: userData.email,
            avatar: userData.avatar || "",
            bio: userData.bio || "",
            skills: userData.skills || "",
            created_at: userData.created_at || new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      // The onAuthStateChanged listener will handle setting the user
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username,
        email,
        avatar: "",
        bio: "",
        skills: "",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      } as any);

      // The onAuthStateChanged listener will handle setting the user
    } catch (error: any) {
      throw new Error(error.message || "Registration failed");
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error: any) {
      throw new Error(error.message || "Logout failed");
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!firebaseUser) throw new Error("No user authenticated");

    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userRef, {
        ...userData,
        updated_at: serverTimestamp(),
      });

      // Update local state
      if (user) {
        setUser({ ...user, ...userData });
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to update profile");
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
