const { db, realtimeDb } = require("../firebase-service");

// Create project
const create = async (req, res) => {
  try {
    const {
      title,
      description,
      stage,
      support_required,
      github_url,
      demo_url,
    } = req.body;

    const projectData = {
      user_id: req.user.id,
      title,
      description,
      stage,
      support_required: support_required || "",
      github_url: github_url || "",
      demo_url: demo_url || "",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const projectRef = await db.collection("projects").add(projectData);

    // Add to feed activities
    await db.collection("feed_activities").add({
      user_id: req.user.id,
      project_id: projectRef.id,
      activity_type: "project_created",
      description: `Created new project: ${title}`,
      created_at: new Date().toISOString(),
    });

    // Real-time notification
    await realtimeDb.ref("feed_updates").push({
      type: "project_created",
      project_id: projectRef.id,
      user_id: req.user.id,
      title,
      message: `Created new project: ${title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      message: "Project created successfully",
      project: { id: projectRef.id, ...projectData },
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

// Get all projects
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const projectsSnapshot = await db
      .collection("projects")
      .where("status", "==", "active")
      .orderBy("created_at", "desc")
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

      projects.push({
        id: doc.id,
        ...projectData,
        username: userData?.username || "Unknown",
        avatar: userData?.avatar || "",
      });
    }

    res.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

// Get project by ID
const getById = async (req, res) => {
  try {
    const projectDoc = await db.collection("projects").doc(req.params.id).get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectData = projectDoc.data();

    // Get user data
    const userDoc = await db.collection("users").doc(projectData.user_id).get();
    const userData = userDoc.data();

    // Get milestones
    const milestonesSnapshot = await db
      .collection("milestones")
      .where("project_id", "==", req.params.id)
      .orderBy("created_at", "desc")
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
      total_milestones: milestones.length,
      completed_milestones: milestones.filter((m) => m.achieved).length,
    });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

// Update project
const update = async (req, res) => {
  try {
    const {
      title,
      description,
      stage,
      support_required,
      github_url,
      demo_url,
    } = req.body;

    const projectDoc = await db.collection("projects").doc(req.params.id).get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectData = projectDoc.data();

    if (projectData.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this project" });
    }

    const updateData = {
      title,
      description,
      stage,
      support_required,
      github_url,
      demo_url,
      updated_at: new Date().toISOString(),
    };

    await db.collection("projects").doc(req.params.id).update(updateData);
    res.json({ message: "Project updated successfully" });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

// Add milestone
const addMilestone = async (req, res) => {
  try {
    const { title, description } = req.body;

    const projectDoc = await db.collection("projects").doc(req.params.id).get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectData = projectDoc.data();

    if (projectData.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to add milestones to this project" });
    }

    const milestoneData = {
      project_id: req.params.id,
      title,
      description,
      achieved: false,
      created_at: new Date().toISOString(),
    };

    const milestoneRef = await db.collection("milestones").add(milestoneData);

    // Add to feed activities
    await db.collection("feed_activities").add({
      user_id: req.user.id,
      project_id: req.params.id,
      activity_type: "milestone_added",
      description: `Added milestone: ${title}`,
      created_at: new Date().toISOString(),
    });

    // Real-time notification
    await realtimeDb.ref("feed_updates").push({
      type: "milestone_added",
      project_id: req.params.id,
      user_id: req.user.id,
      title,
      message: `Added milestone: ${title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      message: "Milestone created successfully",
      milestone: { id: milestoneRef.id, ...milestoneData },
    });
  } catch (error) {
    console.error("Add milestone error:", error);
    res.status(500).json({ error: "Failed to create milestone" });
  }
};

// Achieve milestone
const achieveMilestone = async (req, res) => {
  try {
    const projectDoc = await db.collection("projects").doc(req.params.id).get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectData = projectDoc.data();

    if (projectData.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this project" });
    }

    await db.collection("milestones").doc(req.params.milestoneId).update({
      achieved: true,
      achieved_at: new Date().toISOString(),
    });

    const milestoneDoc = await db
      .collection("milestones")
      .doc(req.params.milestoneId)
      .get();
    const milestoneData = milestoneDoc.data();

    // Add to feed activities
    await db.collection("feed_activities").add({
      user_id: req.user.id,
      project_id: req.params.id,
      activity_type: "milestone_achieved",
      description: `Achieved milestone: ${milestoneData.title}`,
      created_at: new Date().toISOString(),
    });

    // Real-time notification
    await realtimeDb.ref("feed_updates").push({
      type: "milestone_achieved",
      project_id: req.params.id,
      user_id: req.user.id,
      title: milestoneData.title,
      message: `Achieved milestone: ${milestoneData.title}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: "Milestone marked as achieved" });
  } catch (error) {
    console.error("Achieve milestone error:", error);
    res.status(500).json({ error: "Failed to update milestone" });
  }
};

// Complete project
const complete = async (req, res) => {
  try {
    const projectDoc = await db.collection("projects").doc(req.params.id).get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectData = projectDoc.data();

    if (projectData.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to complete this project" });
    }

    await db.collection("projects").doc(req.params.id).update({
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    // Add to feed activities
    await db.collection("feed_activities").add({
      user_id: req.user.id,
      project_id: req.params.id,
      activity_type: "project_completed",
      description: `Completed project: ${projectData.title}`,
      created_at: new Date().toISOString(),
    });

    // Real-time notification
    await realtimeDb.ref("feed_updates").push({
      type: "project_completed",
      project_id: req.params.id,
      user_id: req.user.id,
      title: projectData.title,
      message: `Completed project: ${projectData.title}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: "Project completed successfully" });
  } catch (error) {
    console.error("Complete project error:", error);
    res.status(500).json({ error: "Failed to complete project" });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  addMilestone,
  achieveMilestone,
  complete,
};
