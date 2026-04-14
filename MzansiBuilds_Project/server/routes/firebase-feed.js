const { db, realtimeDb } = require("../firebase-service");

// Get feed activities
const getActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const activitiesSnapshot = await db
      .collection("feed_activities")
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    const activities = [];
    for (const activityDoc of activitiesSnapshot.docs) {
      const userData = await db
        .collection("users")
        .doc(activityDoc.data().user_id)
        .get();
      activities.push({
        id: activityDoc.id,
        ...activityDoc.data(),
        username: userData.data()?.username || "Unknown",
        avatar: userData.data()?.avatar || "",
      });
    }

    res.json(activities);
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
};

// Add comment
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const projectId = req.params.id;

    const commentData = {
      project_id: projectId,
      user_id: req.user.id,
      content,
      created_at: new Date().toISOString(),
    };

    const commentRef = await db.collection("comments").add(commentData);

    // Add to feed activities
    await db.collection("feed_activities").add({
      user_id: req.user.id,
      project_id: projectId,
      activity_type: "comment_added",
      description: "Commented on project",
      created_at: new Date().toISOString(),
    });

    // Get user data for response
    const userDoc = await db.collection("users").doc(req.user.id).get();
    const userData = userDoc.data();

    // Real-time notification
    await realtimeDb.ref("feed_updates").push({
      type: "comment_added",
      project_id: projectId,
      user_id: req.user.id,
      content,
      username: userData.username,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      message: "Comment added successfully",
      comment: {
        id: commentRef.id,
        ...commentData,
        username: userData.username,
        avatar: userData.avatar,
      },
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// Request collaboration
const requestCollaboration = async (req, res) => {
  try {
    const { message } = req.body;
    const projectId = req.params.id;

    // Check if project exists and get owner
    const projectDoc = await db.collection("projects").doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectData = projectDoc.data();

    if (projectData.user_id === req.user.id) {
      return res
        .status(400)
        .json({ error: "Cannot request collaboration on your own project" });
    }

    const requestData = {
      project_id: projectId,
      requester_id: req.user.id,
      message,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    const requestRef = await db
      .collection("collaboration_requests")
      .add(requestData);

    // Add to feed activities
    await db.collection("feed_activities").add({
      user_id: req.user.id,
      project_id: projectId,
      activity_type: "collaboration_requested",
      description: "Requested to collaborate on project",
      created_at: new Date().toISOString(),
    });

    // Get user data for response
    const userDoc = await db.collection("users").doc(req.user.id).get();
    const userData = userDoc.data();

    // Real-time notification to project owner
    await realtimeDb.ref(`collaboration_requests_${projectData.user_id}`).push({
      type: "new_request",
      project_id: projectId,
      request_id: requestRef.id,
      requester: {
        id: req.user.id,
        username: userData.username,
        avatar: userData.avatar,
      },
      message,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      message: "Collaboration request sent successfully",
      request: {
        id: requestRef.id,
        ...requestData,
        username: userData.username,
        avatar: userData.avatar,
      },
    });
  } catch (error) {
    console.error("Request collaboration error:", error);
    res.status(500).json({ error: "Failed to send collaboration request" });
  }
};

// Get collaboration requests
const getCollaborationRequests = async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if user owns the project
    const projectDoc = await db.collection("projects").doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectData = projectDoc.data();

    if (projectData.user_id !== req.user.id) {
      return res.status(403).json({
        error: "Not authorized to view collaboration requests for this project",
      });
    }

    const requestsSnapshot = await db
      .collection("collaboration_requests")
      .where("project_id", "==", projectId)
      .orderBy("created_at", "desc")
      .get();

    const requests = [];
    for (const requestDoc of requestsSnapshot.docs) {
      const requesterDoc = await db
        .collection("users")
        .doc(requestDoc.data().requester_id)
        .get();
      const requesterData = requesterDoc.data();
      requests.push({
        id: requestDoc.id,
        ...requestDoc.data(),
        username: requesterData.username,
        avatar: requesterData.avatar,
      });
    }

    res.json(requests);
  } catch (error) {
    console.error("Get collaboration requests error:", error);
    res.status(500).json({ error: "Failed to fetch collaboration requests" });
  }
};

// Respond to collaboration request
const respondToCollaboration = async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.requestId;

    // Get the collaboration request
    const requestDoc = await db
      .collection("collaboration_requests")
      .doc(requestId)
      .get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: "Collaboration request not found" });
    }

    const requestData = requestDoc.data();

    // Get project to check ownership
    const projectDoc = await db
      .collection("projects")
      .doc(requestData.project_id)
      .get();
    const projectData = projectDoc.data();

    if (projectData.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to respond to this request" });
    }

    await db.collection("collaboration_requests").doc(requestId).update({
      status,
    });

    // Real-time notification to requester
    const userDoc = await db.collection("users").doc(req.user.id).get();
    const userData = userDoc.data();

    await realtimeDb
      .ref(`collaboration_response_${requestData.requester_id}`)
      .push({
        type: "response",
        request_id: requestId,
        project_id: requestData.project_id,
        status,
        responder: {
          id: req.user.id,
          username: userData.username,
          avatar: userData.avatar,
        },
        timestamp: new Date().toISOString(),
      });

    res.json({ message: `Collaboration request ${status} successfully` });
  } catch (error) {
    console.error("Respond to collaboration error:", error);
    res
      .status(500)
      .json({ error: "Failed to respond to collaboration request" });
  }
};

module.exports = {
  getActivities,
  addComment,
  requestCollaboration,
  getCollaborationRequests,
  respondToCollaboration,
};
