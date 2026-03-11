import { Component, DestroyRef, ElementRef, HostListener, inject, OnInit, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { catchError, concatMap, finalize, map, of, ReplaySubject, tap, throwError, timeout } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { ProcesosCedisService } from '../../../service/procesos-cedis.service';
import { DatosService } from '../../../service/servicio.service';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ExcelInventario } from '../../../services/InventarioExel';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
export class InventarioComponent implements OnInit {

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

  public filaEditando: any = null; //Fila identificada para editar
  valorTemporal: string = ''; //valor temporal de la fila editada

  private _datosBase: any[] = [];
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];

  @ViewChildren('inputFocus') inputs!: QueryList<ElementRef>; ///para el foco de la celda es la refernecia o el nombre deñ input

  public camposInfo = [
    { label: 'RangoIni', valor: '' },
    { label: 'RangoFin', valor: '' },
    { label: 'Descripcion', valor: '' }
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
    const body = {
      tipo: 1,
      RangoIni: " ",
      RangoFin: " ",
      Ubica: " "
    };
    this.interaction$.next(body);
  }

  /**
   * Coloca el foco en base a la referncia antes obtenida
   */
  ngAfterViewInit() {
    this.escanearcajaInput.nativeElement.focus()
  }

  private setupWorkfloww() {
    const user = this.datosService.usuarioSignal();
    if (user) this.userRecivido.set(user);

    this.cabeceras.set([
      { nombre: 'Rango Inicial', key: 'lbl_txt1', width: 50 },
      { nombre: 'Rango Final', key: 'lbl_txt2', width: 50 },
      //{ nombre: 'Descripcion', key: 'lbl_txt3', width: 150 },
      { nombre: 'Descripcion', key: 'lbl_txt3', width: 90 }
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

      concatMap(bodyEnviado =>
        this.service.getDInventario(bodyEnviado).pipe(
          // timeout(4000), // Recuerda lo que hablamos del tiempo de red
          map(respuestaApi => ({ resp: respuestaApi, body: bodyEnviado })),
          catchError(err => {
            console.error("❌ [API Error]:", err);
            // Devolvemos un objeto con el mismo formato pero indicando el error
            return of({ resp: { err_id: -1, datos: [] }, body: bodyEnviado });
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ resp, body }) => {
        this.cargando.set(false);

        // --- TIPO 1: PINTAR TABLA COMPLETA ---
        if (body.tipo === 1) {
          if (Array.isArray(resp)) {
            this.tablaDatos.set([...resp]); //Sobreescribe la señal para pintar
            this._datosBase = [...resp];  //copia para el filtro
            this.fechaActualizacion.set(new Date());
          }
          return; // salir después de pintar
        }

        // --- VALIDACIÓN DE RESPUESTAS DE ACCIÓN (2, 3, 4, 5) ---
        if (Array.isArray(resp) && resp.length > 0) {

          // Si la operación fue exitosa
          if (resp[0].err_id === 0) {

            // CASO A: Pasó la validación (Tipo 2), ahora mandamos a (Tipo 3) Guardar (Tipo 3)
            if (body.tipo === 2) {
              console.log("Error " + resp[0].err_id);

              /*if (Number(body.RangoIni) > Number(body.RangoFin)) {
                //console.log("Mayor " + body.RangoIni );
                alert("Rango inicial  " + body.RangoIni + " es mayor que rango final " + body.RangoFin)
                return
              }*/

              this.interaction$.next({ ...body, tipo: 3 });
              return; // IMPORTANTE: Salir para esperar la respuesta del Tipo 3
            }

            // CASO B: Guardado exitoso (Tipo 3) o Edición/Eliminación (4, 5)
            if (body.tipo === 3 || body.tipo === 4 || body.tipo === 5) {

              // Limpiamos los inputs solo si fue un guardado exitoso
              if (body.tipo === 3) this.camposInfo.forEach(c => c.valor = '');

              /**
               * Corta la actualizacion y pintado de la tabla principal
               */
              if (body.tipo === 4 || body.tipo === 5) {
                return; // Cortamos aquí para evitar el refresco total
              }

              // MANDAMOS A REFRESCAR CON TIPO 1
              this.interaction$.next({
                tipo: 1,
                RangoIni: " ",
                RangoFin: " ",
                Ubica: " "
              });
              return;
            }

          } else {
            // Manejo de errores del servidor (err_id != 0)
            alert("Error: " + resp[0].err_msg);
            console.warn("⚠️ Error del servidor:", resp[0].err_msg);
            this.limpiar()
          }
        }

        // Caso de tabla vacía
        else if (Array.isArray(resp) && resp.length === 0 && body.tipo === 1) {
          this.tablaDatos.set([]);
          this._datosBase = [];
        }
      },
      error: (err) => {
        this.cargando.set(false);
        console.error("Falla total del Stream:", err);
      }
    });
  }

  /**
   * Agrega 1 fila al final del resto
   * @param {Event} [event] metodo que atravez de 3 valores que agrega la informacion al sp y se pinta en la tabla principal
   */
  agregarItem() {
    // Verificación de seguridad para evitar clics dobles durante el delay de red
    if (this.isWaiting()) return;

    const v1 = (this.camposInfo[0].valor || '').trim().length;
    const v2 = (this.camposInfo[1].valor || '').trim().length;

    if (v1 > 9 || v2 > 9) {
      alert('No puedes exeder los 10 caracteres')
      this.limpiar()
      return;
    }

    const dataParaEnviar = {
      // Mapeamos los camposInfo a lo que tu API espera
      tipo: 2,
      RangoIni: this.camposInfo[0].valor || " ",
      RangoFin: this.camposInfo[1].valor || " ",
      Ubica: this.camposInfo[2].valor.trim() || " ",
    };


    this.interaction$.next(dataParaEnviar);

    this.limpiar();
  }

  /**************EDICION POR FILA************* */
  /**
   * Habilita la edicion de una fila
   * @param fila es la referncia de una fila dentro de la tabla local
   */
  activarEdicion(fila: any, head: any) {
    // this.filaEditando = { ...fila }; // Copia de lista por si cancela operacion
    this.filaEditando = fila; //Edita la fila (lbl_txt3)
    this.valorTemporal = fila[head.key];

    // Limpia selecciones de texto previas que disparan menús contextuales
    window.getSelection()?.removeAllRanges();

    setTimeout(() => {
      const inputParaEnfocar = this.inputs.first;
      if (inputParaEnfocar) {
        inputParaEnfocar.nativeElement.focus();
        // inputParaEnfocar.nativeElement.select(); 
      }
    }, 50); // 50ms son suficientes para el renderizado
  }

  /**********************CANCELA PETICION DE EDICION************************** */
  /**
   * Cancela la edicion de la fila
   */
  cancelarEdicion() {
    this.filaEditando = null;
    this.valorTemporal = ''; // Limpiamos el buffer
  }

  /************************PARA GUARDAR**************************** */
  /**
   * Guarda los cambios de la tabla local en el sp
   * @param fila referencia a donde se va a editar
   * @returns los datos a pintar
   */
  guardarCambios(fila: any, key: string) {
    // 1. Validar (usando el .trim() que vimos antes)
    if (!this.valorTemporal?.toString().trim()) {
      // alert("El campo no puede estar vacío");
      return;
    }

    // 2. Pasamos el valor del buffer a la fila real ANTES de mandarlo a la API
    fila[key] = this.valorTemporal;

    // 2. Preparar objeto para la API (Mapeando lbl_txt de vuelta a RangoI/F)
    const dataActualizada = {
      tipo: 4,
      RangoIni: fila.lbl_txt1,
      RangoFin: fila.lbl_txt2,
      Ubica: fila.lbl_txt3,
    };

    // 3. Enviar a la API
    this.interaction$.next(dataActualizada);

    // 4. Salir del modo edición y actualizar respaldo
    //this.filaEditando = null;
    // this._datosBase = [...this.tablaDatos()];
    this.limpiar()
  }

  /********************PARA ELIMINAR*********************************/
  /**
   * Elimina un registro de la tabla de inventario mediante el sp .
   * Remueve la fila del arreglo local y vuelve apintar la data.
   * @param {number} index - La posición (índice) de la fila en el arreglo.
   */
  eliminarFila(index: number) {
    // 1. Confirmación de seguridad
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;

    // 2. Obtenemos los datos de la fila antes de borrarla
    const itemAEliminar = this.tablaDatos()[index];

    // 3. Preparamos el cuerpo para la API (Tipo 4 suele ser Delete)
    const body = {
      tipo: 5,
      RangoIni: itemAEliminar.lbl_txt1,
      RangoFin: itemAEliminar.lbl_txt2,
      Ubica: itemAEliminar.lbl_txt3,
    };

    // 4. Enviamos al workflow para que impacte la DB y refresque la tabla
    this.interaction$.next(body);

    // 5. Opcional: Borrado visual inmediato (aunque el Workflow refrescará al terminar)
    this.tablaDatos.update(lista => lista.filter((_, i) => i !== index));
    this._datosBase = [...this.tablaDatos()];
  }

  /*************FILTRO PARA SOLO RECIONOCER LOS NUMEROS *** */
  /**
   * Filtro paar solo tomar los numero introcucido en tiempo real
   * @param event que ayuda a identificar y pintar en el input solo numeros
   * @returns solo los datos que son numero
   */
  soloNumeros(event: KeyboardEvent) {
    // Teclas permitidas: Backspace, Delete, Tab, Escape, Enter, y flechas
    const teclasPermitidas = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];

    if (teclasPermitidas.includes(event.key)) {
      return; // Permitir estas teclas
    }

    // Usamos una expresión regular que solo permite dígitos del 0 al 9
    const esNumero = /^[0-9]$/.test(event.key);

    if (!esNumero) {
      event.preventDefault();
    }
  }

  limpiarEntrada(event: any, index: number) {
    // 1. Obtenemos el valor directamente desde el input del HTML (no del ngModel)
    const input = event.target as HTMLInputElement;
    let valor = input.value;

    // 2. Limpiamos: Solo permitimos números (0-9)
    // El regex /[^0-9]/g busca CUALQUIER COSA que no sea un número y la borra
    const valorLimpio = valor.replace(/[^0-9]/g, '');

    // 3. Forzamos el valor de vuelta tanto al HTML como al objeto de datos
    input.value = valorLimpio;
    this.camposInfo[index].valor = valorLimpio;
  }

  /**
   * Encarga de limpiar las cajas de texto
   * coloca el foco en la primer cahja de texto para que el usuario siga trabajanado
   */
  limpiar() {
    // Limpiamos los campos
    this.camposInfo.forEach(c => c.valor = "");

    // El truco final: un tiempo un poquito más largo para asegurar 
    // que el navegador terminó de procesar el 'Enter'
    setTimeout(() => {
      if (this.escanearcajaInput) {
        this.escanearcajaInput.nativeElement.focus();
      }
    }, 150); // Subimos a 150ms para asegurar la estabilidad
  }

  /********************************************************* */
  /**
   * filtra y visualmente muestra la informacion en la tabla local
   * @param event 
   */
  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value.toLowerCase();//el texto de input a mayuscula
    const filtrados = this._datosBase.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(filtro))
    );// busca los datos similares en la copia local del sp
    this.tablaDatos.set(filtrados); //repinta tabla local
  }
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