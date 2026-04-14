import React, { useState, useEffect, type ReactNode } from "react";
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
import { AuthContext, type AuthContextType } from "./AuthContextDefinition";

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
            id: userQuery.id,
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
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle setting the user
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      throw new Error(errorMessage);
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
      const { user } = userCredential;

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        avatar: "",
        bio: "",
        skills: "",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // The onAuthStateChanged listener will handle setting the user
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Logout failed";
      throw new Error(errorMessage);
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";
      throw new Error(errorMessage);
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
