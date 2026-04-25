import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { UserService, TeamLeadWithMembers } from '../../core/services/user.service';
import { Task } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDividerModule,
    MatBadgeModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private taskService = inject(TaskService);
  private userService = inject(UserService);

  tasks = this.taskService.tasks;
  teamLeads = signal<TeamLeadWithMembers[]>([]);
  teamMembers = signal<User[]>([]);
  loading = signal(true);

  get pendingCount() {
    return this.tasks().filter((t) => t.status === 'pending').length;
  }
  get inProgressCount() {
    return this.tasks().filter((t) => t.status === 'in-progress').length;
  }
  get completedCount() {
    return this.tasks().filter((t) => t.status === 'completed').length;
  }
  get completionRate() {
    const total = this.tasks().length;
    return total ? Math.round((this.completedCount / total) * 100) : 0;
  }
  get recentTasks() {
    return this.tasks().slice(0, 5);
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.taskService.getTasks().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });

    if (this.authService.isManager()) {
      this.userService.getTeamLeadsWithMembers().subscribe({
        next: (res) => this.teamLeads.set(res.teamLeads),
        error: () => {},
      });
    }

    if (this.authService.isTeamLead()) {
      this.userService.getMyTeam().subscribe({
        next: (res) => this.teamMembers.set(res.members),
        error: () => {},
      });
    }
  }

  getStatusColor(status: string): string {
    return { pending: 'warn', 'in-progress': 'accent', completed: 'primary' }[status] || 'primary';
  }

  getPriorityColor(priority: string): string {
    return { high: '#f44336', medium: '#ff9800', low: '#4caf50' }[priority] || '#9e9e9e';
  }
}
