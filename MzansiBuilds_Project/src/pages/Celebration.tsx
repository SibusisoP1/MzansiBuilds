import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { firebaseProjectAPI } from "../services/firebase-api";
import type { Project, CelebrationStats } from "../types";
import "./Celebration.css";

const Celebration: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<CelebrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCelebrationData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        firebaseProjectAPI.getCompletedProjects(12),
        firebaseProjectAPI.getCelebrationStats(),
      ]);

      if (page === 1) {
        setProjects(projectsRes);
      } else {
        setProjects((prev) => [...prev, ...projectsRes]);
      }
      setStats(statsRes);
      setHasMore(projectsRes.length === 12);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  useEffect(() => {
    fetchCelebrationData();
  }, [page, fetchCelebrationData]);

  if (loading && page === 1) {
    return <div className="loading">Loading celebration wall...</div>;
  }

  return (
    <div className="celebration-wall">
      <div className="container">
        <div className="celebration-header">
          <h1> Celebration Wall</h1>
          <p>
            Honoring developers who have built in public and completed their
            projects
          </p>
        </div>

        {stats && (
          <div className="celebration-stats">
            <div className="stat-item">
              <div className="stat-number">{stats.total_completed}</div>
              <div className="stat-label">Projects Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.unique_developers}</div>
              <div className="stat-label">Developers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {Math.round(stats.avg_completion_rate * 100)}%
              </div>
              <div className="stat-label">Avg Completion Rate</div>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="empty-state">
            <p>
              No completed projects yet. Be the first to complete your project
              and join the celebration!
            </p>
            <Link to="/dashboard" className="btn btn-primary">
              Start Building
            </Link>
          </div>
        ) : (
          <>
            <div className="celebration-grid">
              {projects.map((project) => (
                <div key={project.id} className="celebration-card card">
                  <div className="celebration-badge">
                    <span className="badge-icon"> </span>
                    <span className="badge-text">COMPLETED</span>
                  </div>

                  <div className="project-header">
                    <div className="project-avatar">
                      {project.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="project-title">{project.title}</h3>
                      <p className="project-author">by {project.username}</p>
                    </div>
                  </div>

                  <p className="project-description">{project.description}</p>

                  <div className="project-stats">
                    <div className="stat">
                      <span className="stat-value">
                        {project.total_milestones || 0}
                      </span>
                      <span className="stat-name">Milestones</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">
                        {project.completed_milestones || 0}
                      </span>
                      <span className="stat-name">Achieved</span>
                    </div>
                  </div>

                  {project.skills && (
                    <div className="project-skills">
                      <h4>Skills:</h4>
                      <p>{project.skills}</p>
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
                        View Code
                      </a>
                    )}
                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                      >
                        Live Demo
                      </a>
                    )}
                  </div>

                  <div className="celebration-date">
                    Completed on{" "}
                    {new Date(project.completed_at!).toLocaleDateString()}
                  </div>

                  <div className="celebration-actions">
                    <Link
                      to={`/celebration/${project.id}`}
                      className="btn btn-primary"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="load-more">
                <button onClick={loadMore} className="btn btn-outline">
                  Load More Projects
                </button>
              </div>
            )}
          </>
        )}

        {stats && stats.topDevelopers.length > 0 && (
          <div className="top-developers">
            <h2>Top Builders</h2>
            <div className="developers-grid">
              {stats.topDevelopers.map((developer, index) => (
                <div key={developer.username} className="developer-card">
                  <div className="developer-rank">#{index + 1}</div>
                  <div className="developer-avatar">
                    {developer.username[0]?.toUpperCase()}
                  </div>
                  <div className="developer-info">
                    <h4>{developer.username}</h4>
                    <p>{developer.completed_projects} projects completed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Celebration;
