import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Task,
  TaskPayload,
  TaskFilter,
  TasksResponse,
} from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly API = `${environment.apiUrl}/tasks`;

  tasks = signal<Task[]>([]);

  constructor(private http: HttpClient) {}

  getTasks(filter?: TaskFilter): Observable<TasksResponse> {
    let params = new HttpParams();
    if (filter?.status) params = params.set('status', filter.status);
    if (filter?.priority) params = params.set('priority', filter.priority);
    if (filter?.assignedTo) params = params.set('assignedTo', filter.assignedTo);

    return this.http
      .get<TasksResponse>(this.API, { params })
      .pipe(tap((res) => this.tasks.set(res.tasks)));
  }

  getTask(id: string): Observable<{ success: boolean; task: Task }> {
    return this.http.get<{ success: boolean; task: Task }>(`${this.API}/${id}`);
  }

  createTask(payload: TaskPayload): Observable<{ success: boolean; task: Task }> {
    return this.http.post<{ success: boolean; task: Task }>(this.API, payload).pipe(
      tap((res) => {
        this.tasks.update((tasks) => [res.task, ...tasks]);
      })
    );
  }

  updateTask(
    id: string,
    payload: Partial<TaskPayload>
  ): Observable<{ success: boolean; task: Task }> {
    return this.http
      .put<{ success: boolean; task: Task }>(`${this.API}/${id}`, payload)
      .pipe(
        tap((res) => {
          this.tasks.update((tasks) =>
            tasks.map((t) => (t._id === id ? res.task : t))
          );
        })
      );
  }

  deleteTask(id: string): Observable<{ success: boolean; message: string }> {
    return this.http
      .delete<{ success: boolean; message: string }>(`${this.API}/${id}`)
      .pipe(
        tap(() => {
          this.tasks.update((tasks) => tasks.filter((t) => t._id !== id));
        })
      );
  }
  
  addTaskFromSocket(task: Task): void {
    this.tasks.update((tasks) => {
      const exists = tasks.some((t) => t._id === task._id);
      return exists ? tasks : [task, ...tasks];
    });
  }

  updateTaskFromSocket(task: Task): void {
    this.tasks.update((tasks) =>
      tasks.map((t) => (t._id === task._id ? task : t))
    );
  }

  removeTaskFromSocket(taskId: string): void {
    this.tasks.update((tasks) => tasks.filter((t) => t._id !== taskId));
  }
}
