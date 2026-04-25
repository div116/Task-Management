import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TitleCasePipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private socketService = inject(SocketService);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.id) {
        this.socketService.connect(user.id);
      } else {
        this.socketService.disconnect();
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  logout(): void {
    this.authService.logout();
  }
}
