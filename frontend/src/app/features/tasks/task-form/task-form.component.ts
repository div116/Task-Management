import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  authService = inject(AuthService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  taskId = signal<string | null>(null);
  isEditMode = signal(false);
  loading = signal(false);
  fetchingTask = signal(false);
  error = signal('');
  assignableUsers = signal<User[]>([]);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', Validators.maxLength(1000)],
    status: ['pending'],
    priority: ['medium'],
    assignedTo: [''],
    dueDate: [null as Date | null],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.taskId.set(id);
      this.isEditMode.set(true);
      this.loadTask(id);
    }

    this.loadAssignableUsers();
  }

  private loadTask(id: string): void {
    this.fetchingTask.set(true);
    this.taskService.getTask(id).subscribe({
      next: (res) => {
        const t = res.task;
        this.form.patchValue({
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assignedTo: (t.assignedTo as any)?._id || (t.assignedTo as any)?.id || '',
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
        });
        this.fetchingTask.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load task.');
        this.fetchingTask.set(false);
      },
    });
  }

  private loadAssignableUsers(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    if (user.role === 'manager') {
      this.userService.getAllUsers().subscribe({
        next: (res) => this.assignableUsers.set([{ ...user }, ...res.users]),
        error: () => {},
      });
    } else if (user.role === 'teamlead') {
      this.userService.getMyTeam().subscribe({
        next: (res) => this.assignableUsers.set([{ ...user }, ...res.members]),
        error: () => {},
      });
    } else {
      this.assignableUsers.set([{ ...user }]);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const value = this.form.value;
    const payload: any = {
      title: value.title,
      description: value.description,
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate ? (value.dueDate as Date).toISOString() : null,
    };

    if (value.assignedTo) payload.assignedTo = value.assignedTo;

    const request = this.isEditMode()
      ? this.taskService.updateTask(this.taskId()!, payload)
      : this.taskService.createTask(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode() ? 'Task updated successfully!' : 'Task created successfully!',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Operation failed.');
        this.loading.set(false);
      },
    });
  }

  get titleCtrl() { return this.form.get('title')!; }
  get descCtrl() { return this.form.get('description')!; }

  canAssign(): boolean {
    return this.authService.isManager() || this.authService.isTeamLead();
  }
}
