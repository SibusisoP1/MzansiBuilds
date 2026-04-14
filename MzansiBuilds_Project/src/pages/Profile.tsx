import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Profile.css";

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    skills: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        bio: user.bio,
        skills: user.skills,
        avatar: user.avatar,
      });
      setLoading(false);
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
    setSuccess("");

    try {
      await updateProfile(formData);
      setSuccess("Profile updated successfully!");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="error-message">Please login to view your profile</div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your developer profile and showcase your skills</p>
        </div>

        <div className="profile-content">
          <div className="profile-form">
            <h2>Edit Profile</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself and your development journey..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="skills">Skills</label>
                <textarea
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="List your technical skills (e.g., React, Node.js, Python, etc.)"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="avatar">Avatar URL</label>
                <input
                  type="url"
                  id="avatar"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          <div className="profile-info">
            <div className="profile-card">
              <h2>Profile Preview</h2>
              <div className="profile-avatar">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    {formData.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <h3>{formData.username}</h3>
              <p className="profile-email">{user.email}</p>

              {formData.bio && (
                <div className="profile-bio">
                  <h4>Bio</h4>
                  <p>{formData.bio}</p>
                </div>
              )}

              {formData.skills && (
                <div className="profile-skills">
                  <h4>Skills</h4>
                  <div className="skills-tags">
                    {formData.skills.split(",").map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-label">Member Since</span>
                  <span className="stat-value">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <button
                onClick={() => navigate("/dashboard")}
                className="btn btn-outline btn-full"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate("/projects/new")}
                className="btn btn-primary btn-full"
              >
                Create New Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
