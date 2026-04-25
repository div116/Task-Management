export type UserRole = 'manager' | 'teamlead' | 'employee';

export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
  role: UserRole;
  teamLead?: User | string | null;
  manager?: User | string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  teamLeadId?: string;
}
