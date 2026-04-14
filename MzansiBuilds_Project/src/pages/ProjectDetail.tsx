import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { firebaseProjectAPI, firebaseFeedAPI } from "../services/firebase-api";
import type { Project, Comment, CollaborationRequest } from "../types";
import "./ProjectDetail.css";

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<
    CollaborationRequest[]
  >([]);
  const [newComment, setNewComment] = useState("");
  const [collaborationMessage, setCollaborationMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const project = await firebaseProjectAPI.getById(id!);
      setProject(project);

      // Fetch comments separately
      const commentsData = await firebaseFeedAPI.getCollaborationRequests(id!);
      const comments: Comment[] = commentsData.map(activity => ({
        id: activity.id,
        project_id: activity.project_id || id!,
        user_id: activity.user_id,
        content: activity.description,
        created_at: activity.created_at,
        username: activity.username,
        avatar: activity.avatar,
      }));
      setComments(comments);

      // Fetch collaboration requests for project owner
      if (user && project.user_id === user.id) {
        const collaborationData = await firebaseFeedAPI.getCollaborationRequests(id!);
        const collaborationRequests: CollaborationRequest[] = collaborationData
          .filter(activity => activity.activity_type === "collaboration_requested")
          .map(activity => ({
            id: activity.id,
            project_id: activity.project_id || id!,
            requester_id: activity.user_id,
            message: activity.description,
            status: "pending",
            created_at: activity.created_at,
            username: activity.username,
            avatar: activity.avatar,
          }));
        setCollaborationRequests(collaborationRequests);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch project";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await firebaseFeedAPI.addComment(id!, newComment);
      // Add comment locally for now
      const newCommentObj: Comment = {
        id: `comment-${Date.now() + Math.random()}`,
        project_id: id!,
        user_id: user?.id || "",
        content: newComment,
        created_at: new Date().toISOString(),
        username: user?.username || "Anonymous",
        avatar: user?.avatar || "",
      };
      setComments((prev) => [newCommentObj, ...prev]);
      setNewComment("");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add comment";
      setError(errorMessage);
    }
  };

  const handleCollaborationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaborationMessage.trim()) return;

    try {
      await firebaseFeedAPI.requestCollaboration(
        id!,
        collaborationMessage,
      );
      setCollaborationMessage("");
      alert("Collaboration request sent!");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send collaboration request";
      setError(errorMessage);
    }
  };

  const handleCompleteProject = async () => {
    setShowCompleteConfirm(true);
  };

  const confirmCompleteProject = async () => {
    try {
      await firebaseProjectAPI.complete(id!);
      navigate("/celebration");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete project";
      setError(errorMessage);
    }
    setShowCompleteConfirm(false);
  };

  const handleRespondToCollaboration = async (
    requestId: string,
    status: "accepted" | "rejected",
  ) => {
    try {
      // Mock API doesn't have respondToCollaboration, just update locally
      setCollaborationRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status } : req)),
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to respond to collaboration request";
      setError(errorMessage);
    }
  };

  if (loading) {
    return <div className="loading">Loading project...</div>;
  }

  if (error || !project) {
    return <div className="error-message">{error || "Project not found"}</div>;
  }

  const isOwner = user && project.user_id === user.id;

  return (
    <div className="project-detail-page">
      <div className="container">
        {showCompleteConfirm && (
          <div className="confirmation-dialog">
            <div className="confirmation-content">
              <h3>Complete Project</h3>
              <p>
                Are you sure you want to mark this project as completed? This
                will move it to the Celebration Wall.
              </p>
              <div className="confirmation-actions">
                <button
                  onClick={() => setShowCompleteConfirm(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCompleteProject}
                  className="btn btn-primary"
                >
                  Complete Project
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="project-header">
          <div className="project-meta">
            <div className="project-avatar">
              {project.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1>{project.title}</h1>
              <p className="project-author">by {project.username}</p>
              <span className="project-stage">{project.stage}</span>
            </div>
          </div>

          {isOwner && (
            <div className="project-actions">
              <Link
                to={`/projects/${project.id}/edit`}
                className="btn btn-outline"
              >
                Edit Project
              </Link>
              {project.status !== "completed" && (
                <button
                  onClick={handleCompleteProject}
                  className="btn btn-primary"
                >
                  Mark as Complete
                </button>
              )}
            </div>
          )}
        </div>

        <div className="project-content">
          <div className="project-main">
            <div className="project-description">
              <h2>Description</h2>
              <p>{project.description}</p>
            </div>

            {project.support_required && (
              <div className="support-required">
                <h2>Support Required</h2>
                <p>{project.support_required}</p>
              </div>
            )}

            <div className="project-links">
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  View on GitHub
                </a>
              )}
              {project.demo_url && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  View Demo
                </a>
              )}
            </div>

            <div className="project-milestones">
              <h2>Milestones</h2>
              {project.milestones && project.milestones.length > 0 ? (
                <div className="milestones-list">
                  {project.milestones.map((milestone, index) => (
                    <div
                      key={`milestone-${milestone.id || index}`}
                      className={`milestone ${milestone.achieved ? "achieved" : ""}`}
                    >
                      <div className="milestone-checkbox">
                        {milestone.achieved ? " " : " "}
                      </div>
                      <div className="milestone-content">
                        <h4>{milestone.title}</h4>
                        <p>{milestone.description}</p>
                        {milestone.achieved && (
                          <span className="achieved-date">
                            Achieved on{" "}
                            {new Date(
                              milestone.achieved_at!,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No milestones added yet.</p>
              )}
            </div>
          </div>

          <div className="project-sidebar">
            <div className="project-stats">
              <div className="stat">
                <span className="stat-value">
                  {project.total_milestones || 0}
                </span>
                <span className="stat-label">Total Milestones</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {project.completed_milestones || 0}
                </span>
                <span className="stat-label">Completed</span>
              </div>
            </div>

            {project.skills && (
              <div className="project-skills">
                <h3>Skills</h3>
                <p>{project.skills}</p>
              </div>
            )}

            {user && !isOwner && (
              <div className="collaboration-section">
                <h3>Request Collaboration</h3>
                <form onSubmit={handleCollaborationRequest}>
                  <textarea
                    value={collaborationMessage}
                    onChange={(e) => setCollaborationMessage(e.target.value)}
                    placeholder="Introduce yourself and explain how you'd like to collaborate..."
                    rows={4}
                  />
                  <button type="submit" className="btn btn-primary">
                    Send Request
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="project-comments">
          <h2>Comments ({comments.length})</h2>

          {user && (
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
              />
              <button type="submit" className="btn btn-primary">
                Add Comment
              </button>
            </form>
          )}

          <div className="comments-list">
            {comments.map((comment, index) => (
              <div key={`comment-${comment.id || index}`} className="comment">
                <div className="comment-header">
                  <div className="comment-avatar">
                    {comment.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="comment-meta">
                    <span className="comment-user">{comment.username}</span>
                    <span className="comment-time">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>

        {isOwner && collaborationRequests.length > 0 && (
          <div className="collaboration-requests">
            <h2>Collaboration Requests</h2>
            {collaborationRequests.map((request, index) => (
              <div key={`request-${request.id || index}`} className="collaboration-request">
                <div className="request-header">
                  <div className="request-avatar">
                    {request.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="request-meta">
                    <span className="request-user">{request.username}</span>
                    <span className="request-status">{request.status}</span>
                  </div>
                </div>
                <p className="request-message">{request.message}</p>
                {request.status === "pending" && (
                  <div className="request-actions">
                    <button
                      onClick={() =>
                        handleRespondToCollaboration(request.id, "accepted")
                      }
                      className="btn btn-primary"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        handleRespondToCollaboration(request.id, "rejected")
                      }
                      className="btn btn-outline"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
