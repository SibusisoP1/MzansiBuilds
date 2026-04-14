import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { firebaseFeedAPI } from "../services/firebase-api";
import type { FeedActivity } from "../types";
import "./Feed.css";

const Feed: React.FC = () => {
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = async () => {
    try {
      const response = await firebaseFeedAPI.getActivities(10);
      if (page === 1) {
        setActivities(response);
      } else {
        setActivities((prev) => [...prev, ...response]);
      }
      setHasMore(response.length === 10);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  useEffect(() => {
    fetchActivities();
  }, [page, fetchActivities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "project_created":
        return "1";
      case "milestone_added":
        return "2";
      case "milestone_achieved":
        return "3";
      case "project_completed":
        return "4";
      case "comment_added":
        return "5";
      case "collaboration_requested":
        return "6";
      default:
        return "7";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "project_created":
        return "var(--primary-green)";
      case "milestone_achieved":
        return "var(--warning)";
      case "project_completed":
        return "var(--danger)";
      default:
        return "var(--primary-green)";
    }
  };

  if (loading && page === 1) {
    return <div className="loading">Loading feed...</div>;
  }

  return (
    <div className="feed-page">
      <div className="container">
        <div className="page-header">
          <h1>Live Feed</h1>
          <p>See what developers are building in real-time</p>
        </div>

        {activities.length === 0 ? (
          <div className="empty-state">
            <p>No recent activity. Start building to see updates here!</p>
          </div>
        ) : (
          <>
            <div className="feed-list">
              {activities.map((activity) => (
                <div key={activity.id} className="feed-item">
                  <div className="feed-header">
                    <div
                      className="feed-avatar"
                      style={{
                        backgroundColor: getActivityColor(
                          activity.activity_type,
                        ),
                      }}
                    >
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="feed-meta">
                      <span className="feed-user">{activity.username}</span>
                      <span className="feed-time">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="feed-content">
                    <p className="feed-description">{activity.description}</p>

                    {activity.project_title && (
                      <Link
                        to={`/projects/${activity.project_id}`}
                        className="feed-project-link"
                      >
                        {activity.project_title}
                      </Link>
                    )}
                  </div>

                  <div className="feed-actions">
                    <button className="btn btn-outline btn-sm">Like</button>
                    {activity.project_id && (
                      <Link
                        to={`/projects/${activity.project_id}`}
                        className="btn btn-outline btn-sm"
                      >
                        View Project
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="load-more">
                <button onClick={loadMore} className="btn btn-secondary">
                  Load More Activity
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Feed;
