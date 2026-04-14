// Development mode - Firebase will be configured when real credentials are available
// For now, we'll use mock implementations

let db, realtimeDb, admin;

try {
  const admin = require("firebase-admin");
  const serviceAccount = require("../firebase-config.json");

  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mzansibuilds-default-rtdb.firebaseio.com",
    projectId: "mzansibuilds",
  });

  db = admin.firestore();
  realtimeDb = admin.database();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.log("Firebase not configured - running in development mode");

  // Mock implementations for development
  db = {
    collection: () => ({
      add: async (data) => ({ id: Math.random().toString(36).substr(2, 9) }),
      doc: (id) => ({
        get: async () => ({ exists: false, data: () => ({}) }),
        update: async () => ({}),
        delete: async () => ({}),
      }),
      where: () => ({
        get: async () => ({ docs: [] }),
        orderBy: () => ({
          limit: () => ({
            get: async () => ({ docs: [] }),
          }),
        }),
      }),
    }),
  };

  realtimeDb = {
    ref: () => ({
      push: async (data) => ({ key: Math.random().toString(36).substr(2, 9) }),
      on: () => {},
      off: () => {},
    }),
  };
}

module.exports = { db, realtimeDb, admin };
