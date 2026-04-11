import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Feed from "./pages/Feed";
import Celebration from "./pages/Celebration";
import CreateProject from "./pages/CreateProject";
import EditProject from "./pages/EditProject";
import ProjectDetail from "./pages/ProjectDetail";
import Profile from "./pages/Profile";
import "./App.css";
import "./pages/Auth.css";
import "./pages/Home.css";
import "./pages/Dashboard.css";
import "./pages/Feed.css";
import "./pages/Celebration.css";
import "./pages/CreateProject.css";
import "./pages/ProjectDetail.css";
import "./pages/Profile.css";
import "./pages/Projects.css";

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading MzansiBuilds...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route path="/projects" element={<Projects />} />
          <Route
            path="/projects/new"
            element={user ? <CreateProject /> : <Navigate to="/login" />}
          />
          <Route
            path="/projects/:id/edit"
            element={user ? <EditProject /> : <Navigate to="/login" />}
          />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/celebration" element={<Celebration />} />
          <Route
            path="/profile"
            element={user ? <Profile /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
