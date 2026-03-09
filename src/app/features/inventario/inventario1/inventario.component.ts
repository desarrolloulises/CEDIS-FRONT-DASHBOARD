import { Component, DestroyRef, ElementRef, inject, OnInit, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
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
  @ViewChild('escanearcajaInput') escanearcajaInput!: ElementRef;

  // para trabajar peticiones 
  private destroyRef = inject(DestroyRef);
  private interaction$ = new ReplaySubject<any>(1);

  cargando = signal(false);// para indicar el estado de tiempo responde api

  public userRecivido = signal<string>('');
  public fechaActualizacion = signal<Date>(new Date());
  public isWaiting = signal<boolean>(false);
  public tablaDatos = signal<any[]>([]);
  public cabeceras = signal<any[]>([]);
  public columnasAFijar = signal<number>(0);

  public filaEditando: any = null; //Fila identificada para editar
  public celdaEditando: string | null = null; //Columna identificada para editar

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

  ngAfterViewInit() {
    this.escanearcajaInput.nativeElement.focus()

  }
  private setupWorkfloww() {
    const user = this.datosService.usuarioSignal();
    if (user) this.userRecivido.set(user);

    this.cabeceras.set([
      { nombre: 'Rango Inicial', key: 'lbl_txt1', width: 50 },
      { nombre: 'Rango Final', key: 'lbl_txt2', width: 50 },
      { nombre: 'Descripcion', key: 'lbl_txt3', width: 150 }
    ]);
  }

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
            this.tablaDatos.set([...resp]);
            this._datosBase = [...resp];
            this.fechaActualizacion.set(new Date());
          }
          return; // Siempre salir después de pintar
        }

        // --- VALIDACIÓN DE RESPUESTAS DE ACCIÓN (2, 3, 4, 5) ---
        if (Array.isArray(resp) && resp.length > 0) {

          // Si la operación fue exitosa
          if (resp[0].err_id === 0) {

            // CASO A: Pasó la validación (Tipo 2), ahora mandamos a Guardar (Tipo 3)
            if (body.tipo === 2) {
              console.log("Error " + resp[0].err_id);
              /*let dato1 = Number(body.RangoIni)              
              let dato2 = Number(body.RangoFin)
              console.log( dato1 + " " + typeof(dato1) + " > " + dato2 + " " + typeof(dato2)) ;
              */

              if (Number(body.RangoIni) > Number(body.RangoFin)) {
                //console.log("Mayor " + body.RangoIni );
                alert( "Rango inicial  " + body.RangoIni + " es mayor que rango final " + body.RangoFin)
                return
                
              }
              
              this.interaction$.next({ ...body, tipo: 3 });
              // console.log("✅ Validación exitosa (2). Mandando a guardar (3)...");
              return; // IMPORTANTE: Salir para esperar la respuesta del Tipo 3
            }

            // CASO B: Guardado exitoso (Tipo 3) o Edición/Eliminación (4, 5)
            if (body.tipo === 3 || body.tipo === 4 || body.tipo === 5) {
              // console.log(`✅ Acción ${body.tipo} completada. Refrescando tabla...`);

              // Limpiamos los inputs solo si fue un guardado exitoso
              if (body.tipo === 3) this.camposInfo.forEach(c => c.valor = '');

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
   * 
   * @param fila 
   */
  agregarItem() {
    // Verificación de seguridad para evitar clics dobles durante el delay de red
    if (this.isWaiting()) return;
    //para pintar la tabla local
    /* const dataParaTabla = {
       err_id: 0,
       err_msg: "",
       lbl_txt1: this.camposInfo[0].valor, // Rango Inicial
       lbl_txt2: this.camposInfo[1].valor, // Rango Final
       lbl_txt3: this.camposInfo[2].valor, // Ubicación
       tipo: 2
     };*/

    const dataParaEnviar = {
      // Mapeamos los camposInfo a lo que tu API espera
      tipo: 2,
      RangoIni: this.camposInfo[0].valor || " ",
      RangoFin: this.camposInfo[1].valor || " ",
      Ubica: this.camposInfo[2].valor.trim() || " ",
    };

    this.interaction$.next(dataParaEnviar);

    // Validamos que no envíen campos vacíos para la TABLA LOCAL
    /*  if (!dataParaEnviar.RangoIni.trim() || !dataParaEnviar.RangoFin.trim() || !dataParaEnviar.Ubica.trim()) {
        
        return;
      } else {
        console.log("Data ", dataParaTabla);
        this.tablaDatos.update(nuevo => [...nuevo, dataParaTabla]) //agrega a la tabla
        console.log("update ", this.tablaDatos());
  
        this._datosBase = [...this.tablaDatos()]; // agrega al filtro la data nueva   
  
        this.camposInfo.forEach(c => c.valor = ''); //Limpia los campos
      }*/

  }

  /**************EDICION POR FILA************* */
  activarEdicion(fila: any) {
    this.filaEditando = { ...fila }; // Copia de lista por si cancela operacion

    this.filaEditando = fila; //Edita la fila (lbl_txt3)
    setTimeout(() => {
      // Tomamos el primer elemento que encuentre (que será el que se acaba de activar)
      const inputParaEnfocar = this.inputs.first;

      if (inputParaEnfocar) {
        inputParaEnfocar.nativeElement.focus(); // coloco el foco
        // inputParaEnfocar.nativeElement.select(); // Sombrea el texto para editar rápido
      }
    }, 50); // 50ms son suficientes para el renderizado
  }

  /**********************CANCELA PETICION DE EDICION************************** */
  cancelarEdicion() {
    this.filaEditando = null;
  }

  /************************PARA GUARDAR**************************** */
  guardarCambios(fila: any) {
    // 1. Validar (usando el .trim() que vimos antes)
    if (!fila.lbl_txt3?.toString().trim()) {
      //alert("Los rangos no pueden estar vacíos");
      return;
    }

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
    this.filaEditando = null;
    this._datosBase = [...this.tablaDatos()];
  }

  /********************PARA ELIMINAR*********************************/
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
  soloNumeros(event: KeyboardEvent) {
    // Teclas permitidas: Backspace, Delete, Tab, Escape, Enter, y flechas
    const teclasPermitidas = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];

    if (teclasPermitidas.includes(event.key)) {
      return; // Permitir estas teclas
    }

    // Si no es un número (0-9), bloqueamos la acción
    if (event.key < '0' || event.key > '9') {
      event.preventDefault();
    }
  }

  limpiar() {
    this.camposInfo[0].valor = "",
      this.camposInfo[1].valor = "",
      this.camposInfo[2].valor = ""

    this.escanearcajaInput.nativeElement.focus()
  }

  /********************************************************* */



  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value.toLowerCase();
    const filtrados = this._datosBase.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(filtro))
    );
    this.tablaDatos.set(filtrados);
  }

  calcularPosicion(index: number): string {
    const previo = this.cabeceras().slice(0, index).reduce((acc, col) => acc + (col.width || 100), 0);
    return `${previo}px`;
  }

  getClaseEstado(estado: string): string {
    return estado?.toLowerCase().includes('entregado') ? 'entregado' : 'pendiente';
  }

  descargarReporte() {
    this.ExcelInventario.exportToExcelCustom(this.tablaDatos(), 'Reporte');
  }

  
}