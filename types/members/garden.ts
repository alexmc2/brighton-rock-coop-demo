export type GardenAreaStatus = 'active' | 'inactive';
export type GardenTaskStatus =
  | 'pending'
  | 'upcoming'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type GardenProjectStatus =
  | 'active'
  | 'planning'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';
export type GardenTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type PlantStatus = 'alive' | 'dormant' | 'dead' | 'removed';
export type GardenTaskParticipationStatus = 'helping' | 'maybe' | 'unavailable';
export type GardenProjectParticipationStatus = GardenTaskParticipationStatus;

export interface GardenArea {
  id: string;
  name: string;
  description: string | null;
  status: GardenAreaStatus;
  created_at: string;
  updated_at: string;
}

export interface GardenTask {
  id: string;
  title: string;
  description: string;
  status: GardenTaskStatus;
  priority: GardenTaskPriority;
  area_id: string;
  assigned_to: string | null;
  due_date: string | null;
  scheduled_time: string | null;
  duration: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_modified_by: string | null;
}

export interface GardenComment {
  id: string;
  task_id?: string;
  project_id?: string;
  user_id: string;
  comment: string;
  created_at: string;
  user: {
    email: string;
    full_name: string | null;
  };
}

export interface GardenPlant {
  id: string;
  name: string;
  type: string;
  area_id: string | null;
  planting_date: string | null;
  notes: string | null;
  status: PlantStatus;
  created_at: string;
  updated_at: string;
}

export interface GardenTaskParticipant {
  id: string;
  task_id: string;
  user_id: string;
  status: GardenTaskParticipationStatus;
  created_at: string;
  updated_at: string;
  user: {
    email: string;
    full_name: string | null;
  };
}

export interface GardenImage {
  id: string;
  public_id: string;
  secure_url: string;
  task_id?: string | null;
  project_id?: string | null;
  uploaded_by: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
  user: {
    email: string;
    full_name: string | null;
  };
}

export interface GardenTaskWithDetails extends GardenTask {
  area: GardenArea;
  assigned_to_user: {
    email: string;
  } | null;
  created_by_user: {
    email: string;
    full_name: string | null;
  } | null;
  comments: GardenComment[];
  participants: GardenTaskParticipant[];
  images: GardenImage[];
}

export interface GardenAreaWithDetails extends GardenArea {
  tasks: GardenTask[];
  plants: GardenPlant[];
}

export interface ProjectArea {
  id: string;
  name: string;
  description?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

export interface GardenProjectParticipant {
  id: string;
  project_id: string;
  user_id: string;
  status: GardenProjectParticipationStatus;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface GardenProjectWithDetails extends GardenProject {
  area: GardenArea | null;
  comments: GardenComment[];
  created_by_user: UserProfile | null;
  last_modified_by_user: UserProfile | null;
  participants: GardenProjectParticipant[];
  images: GardenImage[];
}

export interface GardenProject {
  id: string;
  title: string;
  description: string;
  status: GardenProjectStatus;
  area_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_modified_by: string | null;
  main_image_public_id?: string | null;
  main_image_secure_url?: string | null;
}

export interface ProjectReport {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  created_by: string;
  last_modified_by: string;
  created_by_user: {
    full_name: string | null;
    email: string;
  };
  last_modified_by_user: {
    full_name: string | null;
    email: string;
  };
}
