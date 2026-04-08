import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PermissionService } from '../../core/permission.service';
import { DatosService } from '../../service/servicio.service';
import { ProcesosCedisService } from '../../service/procesos-cedis.service';
import { IMenuSidebar } from '../../interfaces/ibahia';
//import { MAPEO_RUTAS } from '../../app.routes';


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
    // console.log(this.datosService.usuarioSignal());
  }

  //**************************************************************** */

  ngOnInit() {
    // console.log('Valor del usuario:', this.datosService.usuarioSignal()); // ¿Sale algo aquí?

    const body: IMenuSidebar = {
      Usuario: this.datosService.usuarioSignal(), // Pon uno fijo para probar
      Nivel: 1,
      SubNivel: 0,
      SubAcceso: 0
    };

    //console.log('Llamando a cargarMenu con body:', body);
    this.cargarMenu(body);
  }
  cargarMenu(body: any) {
    //console.log('Entró a la función cargarMenu');
    this.service.getVerMenu(body).subscribe({
      next: (res) => {
        //console.log('Respuesta:', res);
        // Importante: si la API manda el objeto dentro de otra propiedad (ej. res.data), úsala.
        this.modulos.set(res);
      }
    });
  }

  /**** */
  // Dentro de export class SidebarComponent { ...

  // Diccionario para el Nivel 1 (Padres)
  public readonly MAPEO_RUTAS = {
    1: 'menu-calidad',
    2: 'menu-recibo',
    3: 'menu-embarque',
    4: 'menu',
    5: 'menu-toma-inventario',
    13: 'reportes',
    14: 'panel',
    20: 'accesos',

    43: 'recibo'
  };

  // Diccionario para el Nivel 2 (Hijos) - ESTO ES LO QUE TE FALTA
  public readonly MAPEO_RUTAS_HIJOS: Record<string, string> = {
    '3-1': 'menu-embarque/inventario-por-ruta',
    '3-2': 'menu-embarque/inventario-por-tienda',
    '3-3': 'menu-embarque/programacion-embarque',
    '5-1': 'menu-embarque/marbetes-mantenimiento',
    '13-1': 'reporte/reporte-primerReporte',
    '13-2': 'reporte/reporte-primerReporte',
    '14-1': 'panel/Ubicacion-provedores', 

    '20-1': 'accesos/Accesos',
    '20-2': 'accesos/Perfiles',
    '20-3': 'accesos/Accesos-perfil',
    '20-4': 'accesos/Accesos-Usuarios',
    '44-1': 'ver-reporte/44-1'

  };
  /**
   * 
   * @param modulo 
   * @returns 
   */
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
        // Dentro de obtenerSubmenus -> next: (dataHijos) => {
        const subProcesados = dataHijos.map(sub => {
          const llaveUnica = `${modulo.Opcion}-${sub.Opcion}`;

          // 1. Obtenemos la ruta del mapa o 'inicio' por defecto
          const rutaOriginal = this.MAPEO_RUTAS_HIJOS[llaveUnica] || 'inicio';

          // 2. Detectamos si es reporte (buscamos la palabra reporte en la cadena)
          const esReporte = String(rutaOriginal).includes('reporte/');

          // 3. Limpiamos la URL y asignamos el tipo
          let urlFinal = rutaOriginal;
          if (esReporte) {
            urlFinal = rutaOriginal.split('/').pop() || rutaOriginal;
          }

          return {
            ...sub,
            URL: urlFinal,
            tipo: esReporte ? 'reporte' : 'modulo'
          };
        });

        // 4. ACTUALIZACIÓN DE SEÑAL (Asegúrate de que 'cargando' pase a false)
        this.modulos.update(lista => lista.map(m =>
          m.Opcion === modulo.Opcion
            ? { ...m, sub: subProcesados, abierto: true, cargando: false, intentado: true }
            : m
        ));

        // ... resto del update de señales
      },
      error: (err) => {
        // Si da 404, asumimos que no hay submenús y marcamos como abierto/cargado
        console.error('Error al traer submenús', err);
        this.actualizarEstado(modulo.Opcion, {
          cargando: false,
          intentado: true,
          abierto: false
        });
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