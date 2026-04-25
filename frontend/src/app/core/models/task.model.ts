import { User } from './user.model';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: User;
  createdBy: User;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  dueDate?: string | null;
}

export interface TaskFilter {
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  assignedTo?: string;
}

export interface TasksResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  tasks: Task[];
}
