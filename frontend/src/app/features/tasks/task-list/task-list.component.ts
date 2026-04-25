import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskFilter, TaskStatus } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TitleCasePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  tasks = this.taskService.tasks;
  loading = signal(true);
  searchQuery = signal('');
  statusFilter = signal<string>('');
  priorityFilter = signal<string>('');

  filteredTasks = computed(() => {
    let result = this.tasks();
    const q = this.searchQuery().toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.assignedTo?.username?.toLowerCase().includes(q)
      );
    }
    if (this.statusFilter()) {
      result = result.filter((t) => t.status === this.statusFilter());
    }
    if (this.priorityFilter()) {
      result = result.filter((t) => t.priority === this.priorityFilter());
    }
    return result;
  });

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.taskService.getTasks().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  deleteTask(task: Task): void {
    if (!confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;

    this.taskService.deleteTask(task._id).subscribe({
      next: () => {
        this.snackBar.open('Task deleted successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to delete task', 'Close', {
          duration: 4000,
        });
      },
    });
  }

  updateStatus(task: Task, status: TaskStatus): void {
    this.taskService.updateTask(task._id, { status }).subscribe({
      next: () => {
        this.snackBar.open('Status updated', 'Close', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to update status', 'Close', {
          duration: 4000,
        });
      },
    });
  }

  canDelete(task: Task): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'manager') return true;
    if (user.role === 'teamlead') return true; 
    return false; 
  }

  canEdit(task: Task): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'manager' || user.role === 'teamlead') return true;
    return (task.assignedTo?._id || task.assignedTo?.id) === user.id;
  }

  getPriorityColor(priority: string): string {
    return { high: '#f44336', medium: '#ff9800', low: '#4caf50' }[priority] || '#9e9e9e';
  }

  getStatusIcon(status: string): string {
    return (
      { pending: 'radio_button_unchecked', 'in-progress': 'autorenew', completed: 'check_circle' }[status] || 'help'
    );
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.priorityFilter.set('');
  }
}
