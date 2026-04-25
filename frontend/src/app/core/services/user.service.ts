import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, CreateUserPayload } from '../models/user.model';

export interface TeamLeadWithMembers extends User {
  members: User[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<{ success: boolean; count: number; users: User[] }> {
    return this.http.get<{ success: boolean; count: number; users: User[] }>(
      this.API
    );
  }

  getTeamLeadsWithMembers(): Observable<{
    success: boolean;
    teamLeads: TeamLeadWithMembers[];
  }> {
    return this.http.get<{ success: boolean; teamLeads: TeamLeadWithMembers[] }>(
      `${this.API}/team-leads`
    );
  }

  getMyTeam(): Observable<{ success: boolean; count: number; members: User[] }> {
    return this.http.get<{ success: boolean; count: number; members: User[] }>(
      `${this.API}/my-team`
    );
  }

  createUser(
    payload: CreateUserPayload
  ): Observable<{ success: boolean; user: User }> {
    return this.http.post<{ success: boolean; user: User }>(this.API, payload);
  }

  updateUser(
    id: string,
    payload: Partial<User>
  ): Observable<{ success: boolean; user: User }> {
    return this.http.put<{ success: boolean; user: User }>(
      `${this.API}/${id}`,
      payload
    );
  }

  assignEmployeeToTeamLead(
    employeeId: string,
    teamLeadId: string
  ): Observable<{ success: boolean; user: User }> {
    return this.http.put<{ success: boolean; user: User }>(
      `${this.API}/${employeeId}`,
      { teamLeadId }
    );
  }
}
