import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { TaskService } from './task.service';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  constructor(private taskService: TaskService) {}

  connect(userId: string): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.socket?.emit('join:room', userId);
    });

    this.socket.on('task:created', (task: Task) => {
      this.taskService.addTaskFromSocket(task);
    });

    this.socket.on('task:updated', (task: Task) => {
      this.taskService.updateTaskFromSocket(task);
    });

    this.socket.on('task:deleted', (data: { taskId: string }) => {
      this.taskService.removeTaskFromSocket(data.taskId);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
