import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PermissionService } from '../../core/permission.service';
import { DatosService } from '../../service/servicio.service';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  public userRecivido = signal<string>(''); //recibiendo Usiuario

  private router = inject(Router);
  menuUsuarioAbierto = signal(false);

  private permissionService = inject(PermissionService); //para manejar login con guard

  constructor(
    private datosService: DatosService,) {
      console.log(this.datosService.usuarioSignal());
  }


  

  toggleMenuUsuario() {
    this.menuUsuarioAbierto.update(v => !v);
  }
//cierre de sesión, borra el token y redirige a login
  logout() {
    this.permissionService.logout(); // El servicio borra el token
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  // Objeto para controlar qué menús están expandidos
  menusAbiertos: { [key: string]: boolean } = {
    inventario: true, // Empezamos con inventario abierto
    recibo: false
  };

  toggleMenu(menu: string) {
    this.menusAbiertos[menu] = !this.menusAbiertos[menu];
  }
}