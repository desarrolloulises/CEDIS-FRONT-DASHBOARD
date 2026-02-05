import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  // Objeto para controlar qué menús están expandidos
  menusAbiertos: { [key: string]: boolean } = {
    inventario: true, // Empezamos con inventario abierto
    recibo: false
  };

  toggleMenu(menu: string) {
    this.menusAbiertos[menu] = !this.menusAbiertos[menu];
  }
}