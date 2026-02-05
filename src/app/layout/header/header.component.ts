import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  // Estado del menú (cerrado por defecto)
  menuAbierto = signal(false);

  toggleMenu() {
    this.menuAbierto.update(v => !v);
  }

  // Cerrar si se hace clic fuera (opcional para después)
  cerrarMenu() {
    this.menuAbierto.set(false);
  }
}