import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, TeamLeadWithMembers } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  teamLeads = signal<TeamLeadWithMembers[]>([]);
  teamMembers = signal<User[]>([]);
  allUsers = signal<User[]>([]);
  loading = signal(true);
  showCreateForm = signal(false);
  createLoading = signal(false);
  createError = signal('');
  assigningUserId = signal<string | null>(null);
  selectedTeamLeadIds = signal<Record<string, string>>({});
  reassignOpenId = signal<string | null>(null);

  unassignedEmployees = computed(() =>
    this.allUsers().filter(u => u.role === 'employee' && !u.teamLead)
  );

  createForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['employee' as UserRole, Validators.required],
    teamLeadId: [''],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    if (this.authService.isManager()) {
      this.userService.getTeamLeadsWithMembers().subscribe({
        next: (res) => {
          this.teamLeads.set(res.teamLeads);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      this.userService.getAllUsers().subscribe({
        next: (res) => this.allUsers.set(res.users),
        error: () => {},
      });
    } else if (this.authService.isTeamLead()) {
      this.userService.getMyTeam().subscribe({
        next: (res) => {
          this.teamMembers.set(res.members);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  onCreateUser(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.createLoading.set(true);
    this.createError.set('');

    const value = this.createForm.value;
    this.userService
      .createUser({
        username: value.username!,
        email: value.email!,
        password: value.password!,
        role: value.role as UserRole,
        teamLeadId: value.teamLeadId || undefined,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('User created successfully!', 'Close', { duration: 3000 });
          this.createForm.reset({ role: 'employee' });
          this.showCreateForm.set(false);
          this.createLoading.set(false);
          this.loadData();
        },
        error: (err) => {
          this.createError.set(err?.error?.message || 'Failed to create user.');
          this.createLoading.set(false);
        },
      });
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
    this.createError.set('');
    this.createForm.reset({ role: 'employee' });
  }

  onSelectTeamLead(employeeId: string, teamLeadId: string): void {
    this.selectedTeamLeadIds.update(ids => ({ ...ids, [employeeId]: teamLeadId }));
  }

  onAssignEmployee(employeeId: string): void {
    const teamLeadId = this.selectedTeamLeadIds()[employeeId];
    if (!teamLeadId) {
      this.snackBar.open('Please select a team lead first.', 'Close', { duration: 2000 });
      return;
    }
    this.assigningUserId.set(employeeId);
    this.userService.assignEmployeeToTeamLead(employeeId, teamLeadId).subscribe({
      next: () => {
        this.snackBar.open('Employee assigned to team lead!', 'Close', { duration: 3000 });
        this.assigningUserId.set(null);
        this.selectedTeamLeadIds.update(ids => {
          const copy = { ...ids };
          delete copy[employeeId];
          return copy;
        });
        this.loadData();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to assign employee.', 'Close', { duration: 3000 });
        this.assigningUserId.set(null);
      },
    });
  }

  toggleReassign(employeeId: string): void {
    this.reassignOpenId.update(id => id === employeeId ? null : employeeId);
    this.selectedTeamLeadIds.update(ids => {
      const copy = { ...ids };
      delete copy[employeeId];
      return copy;
    });
  }

  onUnassignEmployee(employeeId: string): void {
    this.assigningUserId.set(employeeId);
    this.userService.updateUser(employeeId, { teamLeadId: null } as any).subscribe({
      next: () => {
        this.snackBar.open('Employee unassigned.', 'Close', { duration: 3000 });
        this.assigningUserId.set(null);
        this.reassignOpenId.set(null);
        this.loadData();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to unassign employee.', 'Close', { duration: 3000 });
        this.assigningUserId.set(null);
      },
    });
  }

  onReassignEmployee(employeeId: string): void {
    const teamLeadId = this.selectedTeamLeadIds()[employeeId];
    if (!teamLeadId) {
      this.snackBar.open('Please select a new team lead.', 'Close', { duration: 2000 });
      return;
    }
    this.assigningUserId.set(employeeId);
    this.userService.assignEmployeeToTeamLead(employeeId, teamLeadId).subscribe({
      next: () => {
        this.snackBar.open('Employee reassigned!', 'Close', { duration: 3000 });
        this.assigningUserId.set(null);
        this.reassignOpenId.set(null);
        this.selectedTeamLeadIds.update(ids => {
          const copy = { ...ids };
          delete copy[employeeId];
          return copy;
        });
        this.loadData();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to reassign employee.', 'Close', { duration: 3000 });
        this.assigningUserId.set(null);
      },
    });
  }

  get availableRoles(): UserRole[] {
    return this.authService.isManager() ? ['teamlead', 'employee'] : ['employee'];
  }

  get usernameCtrl() { return this.createForm.get('username')!; }
  get emailCtrl() { return this.createForm.get('email')!; }
  get passwordCtrl() { return this.createForm.get('password')!; }
  get roleCtrl() { return this.createForm.get('role')!; }
}
