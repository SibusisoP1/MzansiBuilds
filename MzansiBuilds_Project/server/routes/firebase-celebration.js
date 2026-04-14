const { db } = require("../firebase-service");

// Get completed projects
const getCompletedProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const projectsSnapshot = await db
      .collection("projects")
      .where("status", "==", "completed")
      .orderBy("completed_at", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    const projects = [];
    for (const doc of projectsSnapshot.docs) {
      const projectData = doc.data();
      const userDoc = await db
        .collection("users")
        .doc(projectData.user_id)
        .get();
      const userData = userDoc.data();

      // Get milestones for this project
      const milestonesSnapshot = await db
        .collection("milestones")
        .where("project_id", "==", doc.id)
        .get();

      const milestones = [];
      milestonesSnapshot.forEach((milestoneDoc) => {
        milestones.push(milestoneDoc.data());
      });

      projects.push({
        id: doc.id,
        ...projectData,
        username: userData?.username || "Unknown",
        avatar: userData?.avatar || "",
        bio: userData?.bio || "",
        skills: userData?.skills || "",
        total_milestones: milestones.length,
        completed_milestones: milestones.filter((m) => m.achieved).length,
      });
    }

    res.json(projects);
  } catch (error) {
    console.error("Get completed projects error:", error);
    res.status(500).json({ error: "Failed to fetch completed projects" });
  }
};

// Get celebration statistics
const getStats = async (req, res) => {
  try {
    // Get total completed projects
    const completedProjectsSnapshot = await db
      .collection("projects")
      .where("status", "==", "completed")
      .get();

    const total_completed = completedProjectsSnapshot.size;

    // Get unique developers
    const uniqueDevelopers = new Set();
    completedProjectsSnapshot.forEach((doc) => {
      uniqueDevelopers.add(doc.data().user_id);
    });

    // Calculate average completion rate
    let totalMilestones = 0;
    let completedMilestones = 0;

    for (const projectDoc of completedProjectsSnapshot.docs) {
      const milestonesSnapshot = await db
        .collection("milestones")
        .where("project_id", "==", projectDoc.id)
        .get();

      const projectMilestones = [];
      milestonesSnapshot.forEach((milestoneDoc) => {
        projectMilestones.push(milestoneDoc.data());
      });

      totalMilestones += projectMilestones.length;
      completedMilestones += projectMilestones.filter((m) => m.achieved).length;
    }

    const avg_completion_rate =
      totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

    // Get top developers
    const developerStats = {};
    for (const projectDoc of completedProjectsSnapshot.docs) {
      const userId = projectDoc.data().user_id;
      developerStats[userId] = (developerStats[userId] || 0) + 1;
    }

    // Get user details for top developers
    const topDevelopers = [];
    const sortedDevelopers = Object.entries(developerStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    for (const [userId, completedProjects] of sortedDevelopers) {
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      topDevelopers.push({
        username: userData?.username || "Unknown",
        avatar: userData?.avatar || "",
        completed_projects: completedProjects,
      });
    }

    res.json({
      total_completed,
      unique_developers: uniqueDevelopers.size,
      avg_completion_rate,
      topDevelopers,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to fetch celebration stats" });
  }
};

// Get completed project by ID
const getById = async (req, res) => {
  try {
    const projectDoc = await db.collection("projects").doc(req.params.id).get();

    if (!projectDoc.exists || projectDoc.data().status !== "completed") {
      return res.status(404).json({ error: "Completed project not found" });
    }

    const projectData = projectDoc.data();

    // Get user data
    const userDoc = await db.collection("users").doc(projectData.user_id).get();
    const userData = userDoc.data();

    // Get milestones
    const milestonesSnapshot = await db
      .collection("milestones")
      .where("project_id", "==", req.params.id)
      .orderBy("achieved_at", "asc")
      .get();

    const milestones = [];
    milestonesSnapshot.forEach((doc) => {
      milestones.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Get comments
    const commentsSnapshot = await db
      .collection("comments")
      .where("project_id", "==", req.params.id)
      .orderBy("created_at", "desc")
      .get();

    const comments = [];
    for (const commentDoc of commentsSnapshot.docs) {
      const commentUserData = await db
        .collection("users")
        .doc(commentDoc.data().user_id)
        .get();
      comments.push({
        id: commentDoc.id,
        ...commentDoc.data(),
        username: commentUserData.data()?.username || "Unknown",
        avatar: commentUserData.data()?.avatar || "",
      });
    }

    res.json({
      id: projectDoc.id,
      ...projectData,
      username: userData.username,
      avatar: userData.avatar,
      bio: userData.bio,
      skills: userData.skills,
      milestones,
      comments,
    });
  } catch (error) {
    console.error("Get completed project error:", error);
    res.status(500).json({ error: "Failed to fetch completed project" });
  }
};

module.exports = {
  getCompletedProjects,
  getStats,
  getById,
};
