export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  skills: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  stage: string;
  support_required: string;
  github_url: string;
  demo_url: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  skills?: string;
  milestones?: Milestone[];
  comments?: Comment[];
  completed_milestones?: number;
  total_milestones?: number;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  achieved: boolean;
  created_at: string;
  achieved_at?: string;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
  avatar?: string;
}

export interface CollaborationRequest {
  id: string;
  project_id: string;
  requester_id: string;
  message: string;
  status: string;
  created_at: string;
  username?: string;
  avatar?: string;
}

export interface FeedActivity {
  id: string;
  user_id: string;
  project_id?: string;
  activity_type: string;
  description: string;
  created_at: string;
  username?: string;
  avatar?: string;
  project_title?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface CelebrationStats {
  total_completed: number;
  unique_developers: number;
  avg_completion_rate: number;
  topDevelopers: Array<{
    username: string;
    avatar: string;
    completed_projects: number;
  }>;
}
