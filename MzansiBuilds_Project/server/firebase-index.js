const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { realtimeDb } = require("./firebase-service");

// Import Firebase routes
const {
  register,
  login,
  getProfile,
  updateProfile,
  authenticateToken,
} = require("./routes/firebase-auth");
const {
  create,
  getAll,
  getById,
  update,
  addMilestone,
  achieveMilestone,
  complete,
} = require("./routes/firebase-projects");
const {
  getActivities,
  addComment,
  requestCollaboration,
  getCollaborationRequests,
  respondToCollaboration,
} = require("./routes/firebase-feed");
const {
  getCompletedProjects,
  getStats,
  getById: getCompletedById,
} = require("./routes/firebase-celebration");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 1000, // Allow 1000 requests per minute
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Firebase Auth Routes
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);
app.get("/api/auth/profile", authenticateToken, getProfile);
app.put("/api/auth/profile", authenticateToken, updateProfile);

// Firebase Project Routes
app.post("/api/projects", authenticateToken, create);
app.get("/api/projects", getAll);
app.get("/api/projects/:id", getById);
app.put("/api/projects/:id", authenticateToken, update);
app.post("/api/projects/:id/milestones", authenticateToken, addMilestone);
app.put(
  "/api/projects/:id/milestones/:milestoneId/achieve",
  authenticateToken,
  achieveMilestone,
);
app.post("/api/projects/:id/complete", authenticateToken, complete);

// Firebase Feed Routes
app.get("/api/feed", getActivities);
app.post("/api/feed/:id/comments", authenticateToken, addComment);
app.post("/api/feed/:id/collaborate", authenticateToken, requestCollaboration);
app.get(
  "/api/feed/:id/collaboration-requests",
  authenticateToken,
  getCollaborationRequests,
);
app.put(
  "/api/feed/collaboration-requests/:requestId/respond",
  authenticateToken,
  respondToCollaboration,
);

// Firebase Celebration Routes
app.get("/api/celebration", getCompletedProjects);
app.get("/api/celebration/stats", getStats);
app.get("/api/celebration/:id", getCompletedById);

// Serve static files from React app
app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// Real-time WebSocket-like functionality using Firebase Realtime Database
const setupRealtimeListeners = () => {
  // Listen for feed updates
  realtimeDb.ref("feed_updates").on("child_added", (snapshot) => {
    const update = snapshot.val();
    console.log("Real-time feed update:", update);
    // In a real implementation, you would emit this to connected clients
    // For now, Firebase handles the real-time updates directly
  });

  // Listen for collaboration requests
  realtimeDb.ref().on("child_added", (snapshot) => {
    const ref = snapshot.ref;
    const path = ref.path;

    if (path.includes("collaboration_requests_")) {
      const data = snapshot.val();
      console.log("New collaboration request:", data);
    }

    if (path.includes("collaboration_response_")) {
      const data = snapshot.val();
      console.log("Collaboration response:", data);
    }
  });
};

setupRealtimeListeners();

app.listen(PORT, () => {
  console.log(`Firebase-powered MzansiBuilds server running on port ${PORT}`);
  console.log("Database: Firebase Firestore");
  console.log("Real-time: Firebase Realtime Database");
  console.log("Authentication: Firebase Auth");
});
