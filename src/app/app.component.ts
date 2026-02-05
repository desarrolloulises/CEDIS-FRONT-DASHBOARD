import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PermissionService } from './core/permission.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'CEDIS-FRONT-DASHBOARD';

  constructor(public servPermisos: PermissionService) {}
}
