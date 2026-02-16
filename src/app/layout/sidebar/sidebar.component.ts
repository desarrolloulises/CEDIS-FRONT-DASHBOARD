import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PermissionService } from '../../core/permission.service';
import { DatosService } from '../../service/servicio.service';
import { ProcesosCedisService } from '../../service/procesos-cedis.service';
import { IMenuSidebar } from '../../interfaces/ibahia';


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

  //para los menus que da la api
  public modulos = signal<any[]>([]);
  private apiService = inject(PermissionService);


  private permissionService = inject(PermissionService); //para manejar login con guard

  constructor(
    private datosService: DatosService,
    private service: ProcesosCedisService,) {
    console.log(this.datosService.usuarioSignal());
  }

  //**************************************************************** */

  ngOnInit() {
    console.log('Valor del usuario:', this.datosService.usuarioSignal()); // ¿Sale algo aquí?

    const body: IMenuSidebar = {
      Usuario: this.datosService.usuarioSignal(), // Pon uno fijo para probar
      Nivel: 1,
      SubNivel: 0,
      SubAcceso: 0
    };

    console.log('Llamando a cargarMenu con body:', body);
    this.cargarMenu(body);
  }
  cargarMenu(body: any) {
    console.log('Entró a la función cargarMenu');
    this.service.getVerMenu(body).subscribe({
      next: (res) => {
        console.log('Respuesta:', res);
        // Importante: si la API manda el objeto dentro de otra propiedad (ej. res.data), úsala.
        this.modulos.set(res);
      }
    });
  }

  obtenerSubmenus(modulo: any) {
    // 1. Si ya tiene submenús O ya intentamos cargarlos y no hubo, solo abrimos/cerramos
    if ((modulo.sub && modulo.sub.length > 0) || modulo.intentado) {
      if (modulo.sub && modulo.sub.length > 0) {
          this.modulos.update(lista => lista.map(m =>
            m.Opcion === modulo.Opcion ? { ...m, abierto: !m.abierto } : m
          ));
      } else {
          // Si no tiene hijos pero ya se intentó, quizás quieres navegar directamente
          //this.navegarAModuloDirecto(modulo);
      }
      return;
    }

    // 2. Preparamos el Body tal cual me lo pasaste
    const body: IMenuSidebar = {
      Usuario: this.datosService.usuarioSignal(),
      Nivel: 2,               // Cambiamos a nivel 2
      SubNivel: modulo.Opcion, // Tu API usa 'Opcion' como ID
      SubAcceso: 0
    };

    this.actualizarEstado(modulo.Opcion, { cargando: true });

    // 3. Llamamos a la MISMA API
    this.service.getVerMenu(body).subscribe({
      next: (dataHijos) => {
        this.modulos.update(lista => lista.map(m =>
          m.Opcion === modulo.Opcion
            ? { ...m, sub: dataHijos, abierto: true, cargando: false }
            : m
        ));
      },
      error: (err) => {
        // Si da 404, asumimos que no hay submenús y marcamos como abierto/cargado
        this.modulos.update(lista => lista.map(m =>
          m.Opcion === modulo.Opcion
            ? { ...m, sub: [], abierto: false, cargando: false, intentado: true }
            : m
        ));
        console.log("Módulo sin hijos o error de red:", err.status);
      }
    });
  }

  // Función auxiliar para no repetir código
  actualizarEstado(opcionId: number, cambios: any) {
    this.modulos.update(lista => lista.map(m =>
      m.Opcion === opcionId ? { ...m, ...cambios } : m
    ));
  }

  //****************************************************************** */




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