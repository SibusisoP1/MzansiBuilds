import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { firebaseProjectAPI } from "../services/firebase-api";
import type { Project } from "../types";
import "./CreateProject.css";

const EditProject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stage: "idea",
    support_required: "",
    github_url: "",
    demo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const projectData = await firebaseProjectAPI.getById(id!);

      setProject(projectData);
      setFormData({
        title: projectData.title,
        description: projectData.description,
        stage: projectData.stage,
        support_required: projectData.support_required,
        github_url: projectData.github_url,
        demo_url: projectData.demo_url,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch project";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await firebaseProjectAPI.update(id!, formData);
      navigate(`/projects/${id}`);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update project";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading project...</div>;
  }

  if (error && !project) {
    return <div className="error-message">{error}</div>;
  }

  if (!project) {
    return <div className="error-message">Project not found</div>;
  }

  return (
    <div className="create-project-page">
      <div className="container">
        <div className="create-project-header">
          <h1>Edit Project</h1>
          <p>Update your project details and progress</p>
        </div>

        <div className="create-project-form">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Project Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter your project name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="stage">Current Stage *</label>
                <select
                  id="stage"
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  required
                >
                  <option value="idea">Idea</option>
                  <option value="planning">Planning</option>
                  <option value="development">Development</option>
                  <option value="testing">Testing</option>
                  <option value="deployment">Deployment</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project, what problem it solves, and your goals"
                rows={5}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="support_required">Support Required</label>
              <textarea
                id="support_required"
                name="support_required"
                value={formData.support_required}
                onChange={handleChange}
                placeholder="What kind of help or collaboration are you looking for?"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="github_url">GitHub URL</label>
                <input
                  type="url"
                  id="github_url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="demo_url">Demo URL</label>
                <input
                  type="url"
                  id="demo_url"
                  name="demo_url"
                  value={formData.demo_url}
                  onChange={handleChange}
                  placeholder="https://your-demo-url.com"
                />
              </div>
            </div>

            <div className="project-info">
              <h3>Project Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Created:</span>
                  <span className="info-value">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated:</span>
                  <span className="info-value">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Milestones:</span>
                  <span className="info-value">
                    {project.total_milestones || 0} total,{" "}
                    {project.completed_milestones || 0} completed
                  </span>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate(`/projects/${id}`)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Update Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProject;
