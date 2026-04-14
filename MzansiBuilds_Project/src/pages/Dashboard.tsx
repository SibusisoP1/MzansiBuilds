import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { firebaseProjectAPI, firebaseFeedAPI } from "../services/firebase-api";
import type { Project, FeedActivity } from "../types";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch real data from Firebase
        const [projectsRes, activitiesRes] = await Promise.all([
          firebaseProjectAPI.getAll(1, 10),
          firebaseFeedAPI.getActivities(5),
        ]);

        // Filter projects to show only user's projects
        const userProjects = projectsRes.filter((project) => project.user_id === user.id);

        setProjects(userProjects);
        setActivities(activitiesRes);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.username}!</h1>
          <p>Continue building in public and track your progress</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number">{projects.length}</div>
            <div className="stat-label">Active Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {projects.reduce(
                (acc, p) => acc + (p.completed_milestones || 0),
                0,
              )}
            </div>
            <div className="stat-label">Milestones Achieved</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {projects.filter((p) => p.status === "completed").length}
            </div>
            <div className="stat-label">Completed Projects</div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Your Projects</h2>
              <Link to="/projects/new" className="btn btn-primary">
                New Project
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="empty-state">
                <p>You haven't created any projects yet.</p>
                <Link to="/projects/new" className="btn btn-primary">
                  Create Your First Project
                </Link>
              </div>
            ) : (
              <div className="project-grid">
                {projects.map((project) => (
                  <div key={project.id} className="project-card card">
                    <div className="project-header">
                      <div className="project-avatar">
                        {project.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="project-title">{project.title}</h3>
                        <span className="project-stage">{project.stage}</span>
                      </div>
                    </div>
                    <p>{project.description}</p>
                    <div className="project-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${
                              project.total_milestones
                                ? (project.completed_milestones! /
                                    project.total_milestones) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {project.completed_milestones || 0} /{" "}
                        {project.total_milestones || 0} milestones
                      </span>
                    </div>
                    <div className="project-actions">
                      <Link
                        to={`/projects/${project.id}`}
                        className="btn btn-outline"
                      >
                        View
                      </Link>
                      {project.status === "active" && (
                        <Link
                          to={`/projects/${project.id}/edit`}
                          className="btn btn-secondary"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Activity</h2>
              <Link to="/feed" className="btn btn-outline">
                View All
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="empty-state">
                <p>No recent activity in the community.</p>
              </div>
            ) : (
              <div className="activity-list">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="activity-item feed-item">
                    <div className="activity-header">
                      <span className="feed-avatar">
                        {activity.username?.[0]?.toUpperCase()}
                      </span>
                      <span className="activity-user">{activity.username}</span>
                      <span className="activity-time">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="activity-description">
                      {activity.description}
                    </p>
                    {activity.project_title && (
                      <Link
                        to={`/projects/${activity.project_id}`}
                        className="activity-project"
                      >
                        {activity.project_title}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-actions">
          <Link to="/projects" className="btn btn-outline">
            Explore All Projects
          </Link>
          <Link to="/celebration" className="btn btn-secondary">
            Celebration Wall
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
