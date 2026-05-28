import {
  Component, Input, Output, EventEmitter,
  signal, inject, HostListener, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PermissionService } from '../../core/permission.service';
import { DatosService } from '../../service/servicio.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() sidebarAbierto = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  menuUsuarioAbierto = signal(false);

  private router = inject(Router);
  private permissionService = inject(PermissionService);
  public datosService = inject(DatosService);
  private elRef = inject(ElementRef);

  onToggle() {
    this.toggleSidebar.emit();
  }

  toggleMenuUsuario() {
    this.menuUsuarioAbierto.update(v => !v);
  }

  // Cierra al hacer click fuera del componente
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.menuUsuarioAbierto.set(false);
    }
  }

  // Cierra con Escape
  @HostListener('document:keydown.escape')
  onEscape() {
    this.menuUsuarioAbierto.set(false);
  }

  logout() {
    this.menuUsuarioAbierto.set(false);
    this.permissionService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  irACambiarPass() {
    this.menuUsuarioAbierto.set(false);
    this.router.navigate(['/CambiaPass']);
  }
}