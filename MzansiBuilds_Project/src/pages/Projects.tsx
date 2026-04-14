import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { firebaseProjectAPI } from "../services/firebase-api";
import type { Project } from "../types";

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProjects = async () => {
    try {
      const response = await firebaseProjectAPI.getAll(page, 12);
      if (page === 1) {
        setProjects(response);
      } else {
        setProjects((prev) => [...prev, ...response]);
      }
      setHasMore(response.length === 12);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  useEffect(() => {
    fetchProjects();
  }, [page, fetchProjects]);

  if (loading && page === 1) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="projects-page">
      <div className="container">
        <div className="page-header">
          <h1>Explore Projects</h1>
          <p>Discover what developers are building</p>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects found. Be the first to share your project!</p>
            <Link to="/projects/new" className="btn btn-primary">
              Create Project
            </Link>
          </div>
        ) : (
          <>
            <div className="projects-grid">
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

                  {project.support_required && (
                    <div className="support-section">
                      <h4>Support Required:</h4>
                      <p>{project.support_required}</p>
                    </div>
                  )}

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

                  <div className="project-links">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                      >
                        GitHub
                      </a>
                    )}
                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                      >
                        Demo
                      </a>
                    )}
                  </div>

                  <div className="project-actions">
                    <Link
                      to={`/projects/${project.id}`}
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
                <button onClick={loadMore} className="btn btn-secondary">
                  Load More Projects
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Projects;
