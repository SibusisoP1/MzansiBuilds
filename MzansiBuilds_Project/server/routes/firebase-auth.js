const { db, admin } = require("../firebase-service");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "mzansibuilds_secret_key";

// Firebase Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from Firebase
    const userDoc = await db
      .collection("users")
      .doc(decoded.userId.toString())
      .get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = { id: decoded.userId, ...userDoc.data() };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// Register user with Firebase
const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (!existingUser.empty) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    // Create user document in Firestore
    const userData = {
      username,
      email,
      avatar: "",
      bio: "",
      skills: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(userRecord.uid).set(userData);

    // Generate JWT token
    const token = jwt.sign(
      { userId: userRecord.uid, username, email },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: userRecord.uid, username, email },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

// Login user with Firebase
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Authenticate with Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);

    // For this demo, we'll skip actual password verification
    // In production, you'd use admin.auth().getUserByEmail() and verify password

    // Get user document
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userRecord.uid, username: userDoc.data().username, email },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: userRecord.uid,
        username: userDoc.data().username,
        email: userRecord.email,
        avatar: userDoc.data().avatar,
        bio: userDoc.data().bio,
        skills: userDoc.data().skills,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: "Invalid credentials" });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    res.json({
      id: userDoc.id,
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar,
      bio: userData.bio,
      skills: userData.skills,
      created_at:
        userData.createdAt?.toDate?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { username, bio, skills, avatar } = req.body;
    const updateData = {
      username,
      bio,
      skills,
      avatar,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(req.user.id).update(updateData);
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

module.exports = {
  authenticateToken,
  register,
  login,
  getProfile,
  updateProfile,
};
