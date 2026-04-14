import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase-config";
import type {
  Project,
  FeedActivity,
} from "../types";

// Firebase Auth API
export const firebaseAuthAPI = {
  register: async (userData: {
    username: string;
    email: string;
    password: string;
  }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password,
      );

      // Create user document in Firestore
      const userDoc = {
        username: userData.username,
        email: userData.email,
        avatar: "",
        bio: "",
        skills: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "users"), userDoc);

      return {
        message: "User registered successfully",
        token: await userCredential.user.getIdToken(),
        user: {
          id: userCredential.user.uid,
          username: userData.username,
          email: userData.email,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      throw new Error(errorMessage);
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );

      // Get user document
      const userQuery = query(
        collection(db, "users"),
        where("email", "==", credentials.email),
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error("User not found");
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      return {
        message: "Login successful",
        token: await userCredential.user.getIdToken(),
        user: {
          id: userDoc.id,
          username: userData.username,
          email: userData.email,
          avatar: userData.avatar || "",
          bio: userData.bio || "",
          skills: userData.skills || "",
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      throw new Error(errorMessage);
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Logout failed";
      throw new Error(errorMessage);
    }
  },

  getCurrentUser: (): FirebaseUser | null => {
    return auth.currentUser;
  },
};

// Firebase Projects API
export const firebaseProjectAPI = {
  create: async (projectData: Partial<Project>) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const project = {
        ...projectData,
        user_id: user.uid,
        status: "active",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "projects"), project);

      // Add to feed activities
      await addDoc(collection(db, "feed_activities"), {
        user_id: user.uid,
        project_id: docRef.id,
        activity_type: "project_created",
        description: `Created new project: ${projectData.title}`,
        created_at: serverTimestamp(),
      });

      // Real-time notification removed - using Firestore only
      // Note: Real-time notifications can be added later with proper Realtime Database setup

      return {
        message: "Project created successfully",
        project: { id: docRef.id, ...project },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create project";
      throw new Error(errorMessage);
    }
  },

  getAll: async (page = 1, limit = 10) => {
    try {
      const q = query(
        collection(db, "projects"),
        orderBy("created_at", "desc"),
        firestoreLimit(limit),
      );

      if (page > 1) {
        // For pagination, you'd need to implement cursor-based pagination
        // This is a simplified version
      }

      const snapshot = await getDocs(q);
      const projects: Project[] = [];

      for (const projectDoc of snapshot.docs) {
        const projectData = projectDoc.data();

        // Get user data
        const userDocRef = doc(db, "users", projectData.user_id);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data() as {
          username: string;
          email: string;
          avatar?: string;
          bio?: string;
          skills?: string;
        };

        // Get milestones count
        const milestonesQuery = query(
          collection(db, "milestones"),
          where("project_id", "==", projectDoc.id),
        );
        const milestonesSnapshot = await getDocs(milestonesQuery);

        projects.push({
          id: projectDoc.id,
          user_id: projectData.user_id,
          title: projectData.title,
          description: projectData.description,
          stage: projectData.stage,
          support_required: projectData.support_required,
          github_url: projectData.github_url,
          demo_url: projectData.demo_url,
          status: projectData.status,
          created_at: projectData.created_at,
          updated_at: projectData.updated_at,
          username: userData?.username || "Unknown",
          avatar: userData?.avatar || "",
          total_milestones: milestonesSnapshot.size,
          completed_milestones: milestonesSnapshot.docs.filter((m) => {
            const milestoneData = m.data() as { achieved?: boolean };
            return milestoneData.achieved || false;
          }).length,
        } as Project);
      }

      return projects;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch projects";
      throw new Error(errorMessage);
    }
  },

  getById: async (id: string) => {
    try {
      const projectDoc = await getDoc(doc(db, "projects", id));

      if (!projectDoc.exists()) {
        throw new Error("Project not found");
      }

      const projectData = projectDoc.data();

      // Get user data
      const userDocRef = doc(db, "users", projectData.user_id);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data() as {
        username: string;
        email: string;
        avatar?: string;
        bio?: string;
        skills?: string;
      };

      // Get milestones
      const milestonesQuery = query(
        collection(db, "milestones"),
        where("project_id", "==", id),
      );
      const milestonesSnapshot = await getDocs(milestonesQuery);

      // Get comments
      const commentsQuery = query(
        collection(db, "comments"),
        where("project_id", "==", id),
      );
      const commentsSnapshot = await getDocs(commentsQuery);

      const milestones = milestonesSnapshot.docs.map((doc) => ({
        id: `milestone-${doc.id}`,
        ...(doc.data() as {
          title: string;
          description: string;
          achieved?: boolean;
          created_at: string;
        }),
      }));

      const comments = [];
      for (const commentDoc of commentsSnapshot.docs) {
        const commentData = commentDoc.data() as {
          content: string;
          user_id: string;
          created_at: string;
        };
        const commentUserDocRef = doc(db, "users", commentData.user_id);
        const commentUserData = await getDoc(commentUserDocRef);
        const commentUserDataObj = commentUserData.data() as {
          username: string;
          avatar?: string;
        };

        comments.push({
          id: `comment-${commentDoc.id}`,
          ...commentData,
          username: commentUserDataObj?.username || "Unknown",
          avatar: commentUserDataObj?.avatar || "",
        });
      }

      return {
        id: projectDoc.id,
        user_id: projectData.user_id,
        title: projectData.title,
        description: projectData.description,
        stage: projectData.stage,
        support_required: projectData.support_required,
        github_url: projectData.github_url,
        demo_url: projectData.demo_url,
        status: projectData.status,
        created_at: projectData.created_at,
        updated_at: projectData.updated_at,
        completed_at: projectData.completed_at,
        username: userData?.username || "Unknown",
        avatar: userData?.avatar || "",
        bio: userData?.bio || "",
        skills: userData?.skills || "",
        milestones,
        comments,
        total_milestones: milestones.length,
        completed_milestones: milestones.filter((m) => {
          const milestoneData = m as {
            title: string;
            description: string;
            achieved?: boolean;
            created_at: string;
          };
          return milestoneData.achieved || false;
        }).length,
      } as Project;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch project";
      throw new Error(errorMessage);
    }
  },

  update: async (id: string, projectData: Partial<Project>) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const projectRef = doc(db, "projects", id);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        throw new Error("Project not found");
      }

      const currentProject = projectDoc.data();

      if (currentProject.user_id !== user.uid) {
        throw new Error("Not authorized to update this project");
      }

      await updateDoc(projectRef, {
        ...projectData,
        updated_at: serverTimestamp(),
      });

      return { message: "Project updated successfully" };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update project";
      throw new Error(errorMessage);
    }
  },

  complete: async (projectId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        status: "completed",
        completed_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Add to feed activities
      await addDoc(collection(db, "feed_activities"), {
        user_id: user.uid,
        project_id: projectId,
        activity_type: "project_completed",
        description: "Project completed successfully",
        created_at: serverTimestamp(),
      });

      return { message: "Project marked as completed" };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete project";
      throw new Error(errorMessage);
    }
  },

  getCompletedProjects: async (limit: number = 12) => {
    try {
      const projectsQuery = query(
        collection(db, "projects"),
        where("status", "==", "completed"),
        firestoreLimit(limit)
      );
      
      const snapshot = await getDocs(projectsQuery);
      const projects = await Promise.all(
        snapshot.docs.map(async (projectDoc) => {
          const projectData = projectDoc.data();
          
          // Get user data
          const userDocRef = doc(db, "users", projectData.user_id);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data() as {
            username: string;
            email: string;
            avatar?: string;
            bio?: string;
            skills?: string;
          };

          return {
            id: projectDoc.id,
            user_id: projectData.user_id,
            title: projectData.title,
            description: projectData.description,
            stage: projectData.stage,
            support_required: projectData.support_required,
            github_url: projectData.github_url,
            demo_url: projectData.demo_url,
            status: projectData.status,
            created_at: projectData.created_at,
            updated_at: projectData.updated_at,
            completed_at: projectData.completed_at,
            username: userData?.username || "Unknown",
            avatar: userData?.avatar || "",
            bio: userData?.bio || "",
            skills: userData?.skills || "",
          } as Project;
        })
      );
      
      return projects;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch completed projects";
      throw new Error(errorMessage);
    }
  },

  getCelebrationStats: async () => {
    try {
      const projectsQuery = query(
        collection(db, "projects"),
        where("status", "==", "completed")
      );
      
      const snapshot = await getDocs(projectsQuery);
      const completedProjects = snapshot.docs.map(doc => doc.data());
      
      // Calculate stats
      const totalProjects = completedProjects.length;
      const totalBuilders = new Set(completedProjects.map(p => p.user_id)).size;
      
      return {
        total_completed: totalProjects,
        unique_developers: totalBuilders,
        avg_completion_rate: 0, // Could be calculated based on created_at vs completed_at
        topDevelopers: [] // Could be calculated based on completion counts
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch celebration stats";
      throw new Error(errorMessage);
    }
  },
};

// Firebase Feed API
export const firebaseFeedAPI = {
  getActivities: async (limit: number = 10) => {
    try {
      const activitiesQuery = query(
        collection(db, "feed_activities"),
        firestoreLimit(limit)
      );
      
      const snapshot = await getDocs(activitiesQuery);
      const activities = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `activity-${doc.id}`,
          user_id: data.user_id,
          project_id: data.project_id,
          activity_type: data.activity_type || "",
          description: data.description || "",
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          username: data.username || "",
          avatar: data.avatar || "",
          project_title: data.project_title || ""
        } as FeedActivity;
      });
      
      return activities;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch feed activities";
      throw new Error(errorMessage);
    }
  },

  addComment: async (projectId: string, comment: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      await addDoc(collection(db, "feed_activities"), {
        user_id: user.uid,
        project_id: projectId.toString(),
        activity_type: "comment_added",
        description: `Commented: ${comment}`,
        created_at: serverTimestamp(),
      });

      return { message: "Comment added successfully" };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add comment";
      throw new Error(errorMessage);
    }
  },

  requestCollaboration: async (projectId: string, message: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      await addDoc(collection(db, "feed_activities"), {
        user_id: user.uid,
        project_id: projectId.toString(),
        activity_type: "collaboration_requested",
        description: `Requested collaboration: ${message}`,
        created_at: serverTimestamp(),
      });

      return { message: "Collaboration request sent" };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to request collaboration";
      throw new Error(errorMessage);
    }
  },

  getCollaborationRequests: async (projectId: string) => {
    try {
      const requestsQuery = query(
        collection(db, "feed_activities"),
        where("project_id", "==", projectId.toString()),
        where("activity_type", "==", "collaboration_requested")
      );
      
      const snapshot = await getDocs(requestsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `activity-${doc.id}`,
          user_id: data.user_id,
          project_id: data.project_id,
          activity_type: data.activity_type || "",
          description: data.description || "",
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          username: data.username || "",
          avatar: data.avatar || "",
          project_title: data.project_title || ""
        } as FeedActivity;
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch collaboration requests";
      throw new Error(errorMessage);
    }
  },


  getCelebrationStats: async () => {
    try {
      const projectsQuery = query(
        collection(db, "projects"),
        where("status", "==", "completed")
      );
      
      const snapshot = await getDocs(projectsQuery);
      const completedProjects = snapshot.docs.map(doc => doc.data());
      
      // Calculate stats
      const totalProjects = completedProjects.length;
      const totalBuilders = new Set(completedProjects.map(p => p.user_id)).size;
      
      return {
        total_completed: totalProjects,
        unique_developers: totalBuilders,
        avg_completion_rate: 0, // Could be calculated based on created_at vs completed_at
        topDevelopers: [] // Could be calculated based on completion counts
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch celebration stats";
      throw new Error(errorMessage);
    }
  },
};
