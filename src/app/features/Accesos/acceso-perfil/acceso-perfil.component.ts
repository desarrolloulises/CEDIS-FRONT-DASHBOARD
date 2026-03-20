import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, ElementRef, HostListener, inject, OnInit, QueryList, Signal, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, concatMap, map, of, ReplaySubject, tap } from 'rxjs';
import { ExcelInventario } from '../../../services/InventarioExel';
import { HttpClient } from '@angular/common/http';
import { ProcesosCedisService } from '../../../service/procesos-cedis.service';
import { DatosService } from '../../../service/servicio.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { computed } from '@angular/core';

@Component({
  selector: 'app-acceso-perfil',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './acceso-perfil.component.html',
  styleUrl: './acceso-perfil.component.css'
})
export class AccesoPerfilComponent implements OnInit {

  @ViewChild('escanearcajaInput') escanearcajaInput!: ElementRef; //Referencia a el input RangoIni
  @ViewChild('filtroInput') filtroInput!: ElementRef<HTMLInputElement>; //referncia a el filtro

  // para trabajar peticiones 
  private destroyRef = inject(DestroyRef);
  private interaction$ = new ReplaySubject<any>(1);

  cargando = signal(false);// para indicar el estado de tiempo responde api

  public userRecivido = signal<string>('');
  public fechaActualizacion = signal<Date>(new Date());
  public isWaiting = signal<boolean>(false);
  public tablaDatos = signal<any[]>([]);
  public cabeceras = signal<any[]>([]); //signal que almacena las cabeceras
  public columnasAFijar = signal<number>(0);

  public opcionesCombo = signal<{ label: string, value: any }[]>([]); //Signasl para almacenar datos de la lista desplegable

  public filaEditando: any = null; //Fila identificada para editar
  valorTemporal: string = ''; //valor temporal de la fila editada

  
  public cancelClick: boolean = false; //va ayudar a cancelar los clicks

  public clavePerfilGuardada = signal<string>('');

  //public todosSeleccionados = false; // Controla qué botón se ve
  public cargandoTodo = false;          // Evita clics repetidos (nuestro guardián)

  public todosSeleccionados = computed(() => {
    const filas = this.tablaDatos();

    // Si no hay datos, por defecto mostrar "Asignar todos" (false)
    if (!filas || filas.length === 0) return false;

    // IMPORTANTE: Solo devuelve TRUE si TODAS las filas tienen la propiedad 'seleccionado' como true.
    // Si tan solo una es false, undefined o null, devolverá FALSE.
    return filas.every(f => f.seleccionado === true);
  });


  @ViewChildren('inputFocus') inputs!: QueryList<ElementRef>; ///para el foco de la celda es la refernecia o el nombre deñ input

  public camposInfo = [
    { label: 'tipo', valor: '' },
    { label: 'ClaveP', valor: '' },
    { label: 'ClaveA', valor: '' },
    { label: 'TipoA', valor: '' },
  ];

  constructor(
    private ExcelInventario: ExcelInventario,
    private http: HttpClient,
    private service: ProcesosCedisService,
    private datosService: DatosService,
  ) {
    this.setupWorkflow() 
  }

  ngOnInit() {
    this.setupWorkfloww();
    this.interaction$.next({
      tipo: 1,
      ClaveP: "0",
      Descripcion: " ",
      bandera: "perfil"
    });
  }
 
  private setupWorkfloww() {
    const user = this.datosService.usuarioSignal();
    if (user) this.userRecivido.set(user);

    this.cabeceras.set([
      { nombre: 'Clave de Acceso', key: 'lbl_txt1', width: 90 },
      { nombre: 'Nivel', key: 'lbl_txt2', width: 50 },
      { nombre: 'SubNivel', key: 'lbl_txt3', width: 40 },
      { nombre: 'SubAcceso', key: 'lbl_txt4', width: 40 },
      { nombre: 'Descripcion', key: 'lbl_txt5', width: 200 },
    ]);
  }
  /**
   * core del aplicativo tiene conexion con API, el flujo de trabajo y contro de errores con la API
   * @param body contiene el payload del aplicativo
   *  @param Usuario es el usuario fresco 
   * @param resp son la data que debuelve la API
   * @param cargando Indica el flujo del aplicativo (espera de respuesta o ya recibio esta)
   */
  private setupWorkflow() {
    this.interaction$.pipe(
      tap(() => this.cargando.set(true)),

      map(body => {
        // Leemos el valor actual de la Signal del componente
        const currentUser = this.userRecivido();
        if (!currentUser) {
          console.warn("Intento de petición sin usuario identificado");
        }
        return {
          ...body,
          Usuario: currentUser
        };
      }),

      concatMap(bodyEnviado => {
        const { bandera, ...bodyLimpio } = bodyEnviado;

        // 1. Normalizamos: convertimos a string, quitamos espacios y pasamos a minúsculas
        const banderaNormalizada = String(bandera || '').trim().toLowerCase();

        //console.log("Comparando:", `"${banderaNormalizada}"`, "con 'perfil'");

        // 2. La lógica de decisión
        const apiCall$ = (banderaNormalizada === 'perfil') //mediante la bandera determinas la API
          ? this.service.getAccesoPerfiles(bodyLimpio)
          : this.service.getAccesoPerfilesAsignados(bodyLimpio);

        return apiCall$.pipe(
          map(respuestaApi => ({ resp: respuestaApi, body: bodyEnviado })),
          catchError(err => {
            console.error("❌ [API Error]:", err);
            return of({ resp: { err_id: -1, datos: [] }, body: bodyEnviado });
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ resp, body }) => {
        this.cargando.set(false);
        //console.log("body ", body);
       // console.log("va a pintar ", resp);

        // --- TIPO 1: PINTAR TABLA COMPLETA ---
        if (body.tipo === 1 && body.bandera === 'perfil') {
          //console.log("badera pintar " + body.bandera);


          // 2. Verificamos que sea un array antes de procesar
          if (Array.isArray(resp)) {
            const nombres = resp.map((item: any) => ({
              label: item.lbl_txt2?.trim(),
              value: item.lbl_txt1
            }));
            // console.log(nombres);


            // 3. Actualizamos la Signal
            this.opcionesCombo.set(nombres);

            // console.log("Combo actualizado con:", nombres.length, "elementos");
          } else {
            /*
                        console.log("Bandera 2 " + body.bandera);
                        const datosTransformados = resp.map((item: any) => ({
                          ...item, // Conservamos todas las propiedades originales por si las necesitas
                          label: item.lbl_txt6?.trim(),
                          value: item.lbl_txt6,
            
                          // Aquí convertimos el 0/1 de la API en el booleano que usa tu checkbox
                          // Si item.lbl_txt3 es 1, seleccionado será true.
                          seleccionado: Number(item.lbl_txt6) === 1
                        }));
            
                        this.tablaDatos.set([datosTransformados]); //Sobreescribe la señal para pintar
                        //this._datosBase = [...resp];  //copia para el filtro
                        //this.fechaActualizacion.set(new Date());
            */
            // Si no es un array, reseteamos la Signal a vacía para evitar errores en el HTML
            console.warn("La respuesta no contiene el array esperado en 'datos':", resp);
            this.opcionesCombo.set([]);
          }

          return;
        } else {
          if (body.tipo === 2 || body.tipo === 3) {
            return
          }

          //console.log("Bandera 2 " + body.bandera);
          const datosTransformados = resp.map((item: any) => ({
            ...item, // Conservamos todas las propiedades originales por si las necesitas
            label: String(item.lbl_txt6 || '').trim(),
            value: item.lbl_txt6,

            // Aquí convertimos el 0/1 de la API en el booleano que usa tu checkbox
            // Si item.lbl_txt3 es 1, seleccionado será true.
            seleccionado: Number(item.lbl_txt6) === 1
          }));
         // console.log(datosTransformados);


          this.tablaDatos.set(datosTransformados); //Sobreescribe la señal para pintar
 
          return
        }
 
      },
      error: (err) => {
        this.cargando.set(false);
        console.error("Falla total del Stream:", err);
      }
    });
  }

  /**************************************************************************** */
  toggleSeleccion(fila: any) {
    if (this.cancelClick) return;
    this.cancelClick = true;

    // 1. OBTENEMOS EL ESTADO ACTUAL
    // Si la fila ya tenía 'seleccionado', lo invertimos. 
    // Si no existía la propiedad, forzamos que empiece en 'true'.
    const nuevoEstado = !fila.seleccionado;

    // 2. ARMAR EL BODY PARA LA API
    const body = {
      tipo: 2,
      ClaveP: this.clavePerfilGuardada(),
      ClaveA: fila.lbl_txt1, // <--- Aquí mandamos la posición del check a la API
      TipoA: nuevoEstado ? 1 : 0,
      bandera: "perfil2"
    };
    
    this.interaction$.next(body);

    // 3. ACTUALIZAR LA TABLA (Visual)
    this.tablaDatos.update(filas =>
      filas.map(f => {
        // Comparamos la posición (lbl_txt1) de la fila actual con la que recibió el clic
        if (f.lbl_txt1 === fila.lbl_txt1) {
          return { ...f, seleccionado: nuevoEstado };
        }
        return f;
      })
    );

    // 4. LIBERAR PARA EL SIGUIENTE CLIC
    setTimeout(() => {
      this.cancelClick = false;
    }, 400); // Un poco más rápido para mejorar la experiencia
}

  // BOTÓN 1: ASIGNAR TODO
  seleccionarTodo() {
    if (this.cargandoTodo) return;
    const clave = this.camposInfo[0].valor;
    if (!clave) return alert("Seleccione un nivel");

    this.cargandoTodo = true;

    // ACTUALIZACIÓN MASIVA
    this.tablaDatos.update(filas => {
      // IMPORTANTE: Creamos objetos nuevos con la propiedad explícita
      return filas.map(f => ({
        ...f,
        seleccionado: true
      }));
    });

    // API
    this.interaction$.next({ tipo: 3, ClaveP: clave, ClaveA : " ", TipoA: 1, bandera: "perfil2" });

    setTimeout(() => this.cargandoTodo = false, 500);
  }

  deSeleccionar() {
    if (this.cargandoTodo) return;

    const clave = this.camposInfo[0].valor;
    this.cargandoTodo = true;

    // --- REINICIO VISUAL ---
    this.tablaDatos.update(filas => {
      // IMPORTANTE: Asegúrate de que sea 'false' (minúscula)
      return filas.map(f => ({ ...f, seleccionado: false }));
    });

    // --- API ---
    const body = {
      tipo: 3,
      ClaveP: clave,
      ClaveA: ' ',
      TipoA: 0, // 0 para borrar asignación
      bandera: "perfil2"
    };
    this.interaction$.next(body);

    // Liberamos el botón
    setTimeout(() => {
      this.cargandoTodo = false;
    }, 500);
  }

  /********************************************************* */
  
  /**
   * Calcula la posición horizontal (left) de una columna sumando los anchos de las columnas previas.
   * Útil para posicionamiento dinámico de elementos o columnas fijas (sticky).
   * * @param {number} index - El índice de la columna actual de la cual se desea conocer su posición inicial.
   * @returns {string} La distancia acumulada en píxeles (ej. "450px").
   */
  calcularPosicion(index: number): string {
    const previo = this.cabeceras().slice(0, index).reduce((acc, col) => acc + (col.width || 100), 0);
    return `${previo}px`;
  }

  getClaseEstado(estado: string): string {
    return estado?.toLowerCase().includes('entregado') ? 'entregado' : 'pendiente';
  }

  /**
   * Carga los datos a la tabla a descargar en el archivo asi como un nombre de archivo (libro)
   */
  descargarReporte() {
    this.ExcelInventario.exportToExcelCustom(this.tablaDatos(), 'Catalogo de marbete');
  }
  /**************************************************************************************** */
  invertirSeleccion() {
    this.tablaDatos.update(datos =>
      datos.map(fila => ({
        ...fila,
        seleccionado: !fila.seleccionado // Lo que era true pasa a false y viceversa
      }))
    );
  }
  /**
   * Pa cuando seleciona un elemento de la lista desplegable con los perfiles
   */


  capturarValue(id: any) {
    this.clavePerfilGuardada.set(id)
    // Aquí ya tienes el ID para tu API
    const body = {
      tipo: 1,
      ClaveP: id,
      ClaveA: ' ',
      TipoA: ' ',
      bandera: "perfil2"
    };
   //console.log(body);


    // 4. Enviamos al workflow para que impacte la DB y refresque la tabla
    this.interaction$.next(body);

  }




  /**
   * Detecta los eventos del teclado
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Detectamos Ctrl + F o Cmd + F (Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      event.preventDefault(); // IMPORTANTE: Evita que se abra el buscador del navegador
      this.enfocarFiltro();
    }
  }

  enfocarFiltro() {
    this.filtroInput.nativeElement.focus();
    this.filtroInput.nativeElement.select(); // Selecciona el texto para borrarlo rápido o editar
  }

}