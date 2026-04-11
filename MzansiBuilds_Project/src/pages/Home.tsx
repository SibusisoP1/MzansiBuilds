import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home: React.FC = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <h1>MzansiBuilds</h1>
          <p>
            Build in public, collaborate with fellow developers, and celebrate
            your achievements together
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Start Building
            </Link>
            <Link to="/projects" className="btn btn-outline btn-large">
              Explore Projects
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Why Build in Public?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">1</div>
              <h3>Create & Share</h3>
              <p>
                Share your projects, track progress, and get feedback from the
                community
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">2</div>
              <h3>Collaborate</h3>
              <p>
                Connect with other developers, offer help, and find
                collaborators for your projects
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">3</div>
              <h3>Celebrate Success</h3>
              <p>
                Join the Celebration Wall when you complete your projects and
                inspire others
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create your account and set up your developer profile</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Add Projects</h3>
              <p>
                Create entries for projects you're working on and set milestones
              </p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Engage</h3>
              <p>
                Comment on projects, request collaboration, and follow the live
                feed
              </p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Celebrate</h3>
              <p>Mark projects as complete and join the Celebration Wall</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Join Our Community</h2>
          <div className="community-stats">
            <div className="stat">
              <div className="stat-number">100+</div>
              <div className="stat-label">Active Developers</div>
            </div>
            <div className="stat">
              <div className="stat-number">50+</div>
              <div className="stat-label">Projects Built</div>
            </div>
            <div className="stat">
              <div className="stat-number">200+</div>
              <div className="stat-label">Milestones Achieved</div>
            </div>
          </div>
          <div className="community-cta">
            <Link to="/register" className="btn btn-primary btn-large">
              Become Part of MzansiBuilds
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
