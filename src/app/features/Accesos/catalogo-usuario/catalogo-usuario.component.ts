import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, ElementRef, HostListener, inject, OnInit, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, concatMap, map, of, ReplaySubject, tap } from 'rxjs';
import { ExcelInventario } from '../../../services/InventarioExel';
import { ProcesosCedisService } from '../../../service/procesos-cedis.service';
import { DatosService } from '../../../service/servicio.service';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-catalogo-usuario',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './catalogo-usuario.component.html',
  styleUrl: './catalogo-usuario.component.css'
})
export class CatalogoUsuarioComponent implements OnInit {

  @ViewChild('escanearcajaInput') escanearcajaInput!: ElementRef; //Referencia a el input RangoIni
  @ViewChild('filtroInput') filtroInput!: ElementRef<HTMLInputElement>; //referncia a el 



  // para trabajar peticiones 
  private destroyRef = inject(DestroyRef);
  private interaction$ = new ReplaySubject<any>(1);

  cargando = signal(false);// para indicar el estado de tiempo responde api

  public userRecivido = signal<string>('');
  public isWaiting = signal<boolean>(false);
  public tablaDatos = signal<any[]>([]);

  public opcionesCombo = signal<{ label: string, value: any }[]>([]); //Signasl para almacenar datos de la lista desplegable

  public cancelClick: boolean = false; //va ayudar a cancelar los clicks

  public clavePerfilGuardada = signal<string>('');

  //public todosSeleccionados = false; // Controla qué botón se ve
  public cargandoTodo = false;          // Evita clics repetidos (nuestro guardián)

  public cargandoBusqueda: boolean = false; // variable par el metodo de busqueda
  public perfilSeleccionado: string = ""; // es la variable refernte al valor del combo de perfil



  @ViewChildren('inputFocus') inputs!: QueryList<ElementRef>; ///para el foco de la celda es la refernecia o el nombre deñ input

  public camposInfo = [
    { label: 'tipo', valor: '' },
    { label: 'ClaveP', valor: '' },
    { label: 'ClaveA', valor: '' },
    { label: 'TipoA', valor: '' },
  ];

  // variables par los input 
  public claveUsuario: string = '';
  public nombreUsuario: string = '';
  public nombrePuesto: string = '';
  public estatusNumerico: number = 1;// Para guardar el valor numeroco del combo de ESTATUS
  public estatusActualTexto: string = ''
  


  constructor(
    private ExcelInventario: ExcelInventario,
    private http: HttpClient,
    private service: ProcesosCedisService,
    private datosService: DatosService,
  ) {
    this.setupWorkflow()
  }

  ngOnInit() {
    const user = this.datosService.usuarioSignal();
    if (user) this.userRecivido.set(user);
    //carga el perfil
    this.interaction$.next({
      tipo: 1,
      ClaveP: "0",
      Descripcion: " ",
      bandera: "perfil"
    });
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
          : this.service.getAccesosUsuario(bodyLimpio);

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
        this.cargandoBusqueda = false;
        //console.log("body ", body);
        // console.log("va a pintar ", resp);
        // console.log(resp);


        // --- TIPO 1: PINTAR COMBO O LISTA DESPLEGABLE ---
        if (body.tipo === 1 && body.bandera === 'perfil') {
         // console.log("badera pintar " + body.bandera);
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
            // Si no es un array, reseteamos la Signal a vacía para evitar errores en el HTML
            console.warn("La respuesta no contiene el array esperado en 'datos':", resp);
            this.opcionesCombo.set([]);
          }

          return;
        } else {
          // Para peticion Accesos_Usuario
          const valor = body.ClaveU;

          // console.log(resp[0].err_id + " === 0 " + " && " + body.tipo + "=== 1");

          if (resp[0].err_id === 0 && body.tipo === 1) {
            const body = {
              tipo: 2,
              ClaveE: " ",
              ClaveU: valor,
              ClaveP: ' ', //      TipoA: nuevoEstado ? 1 : 0,
              bandera: "perfil2"
            };

            this.interaction$.next(body);
            return
          } else if (resp[0].err_id !== 0) {
            alert(resp[0].err_msg)
          }

          if (body.tipo === 2) {
           // console.log(resp[0]);
            this.nombreUsuario = resp[0].lbl_text1
            this.nombrePuesto = resp[0].lbl_text2
            // Usamos la variable que guardó el cambio del combo
            this.procesarRespuesta(resp)
            this.procesarRespuestaEstaus(resp)
            /*
            lbl_Text2:"MONITORISTA"
            lbl_Text3:0
            lbl_Text4:""
            lbl_Text5:""
            lbl_text1:"BERNABE PEREZ JESUS"
            */

          }

          return
        }

      },
      error: (err) => {
        this.cargando.set(false);
        console.error("Falla total del Stream:", err);
      }
    });
  }
  /************************************************************* */
  buscarDatos(valor: string) {

    if (valor.trim().length < 1) {
      console.log("valor " + valor);

      return
    }

    this.cargandoBusqueda = true;

    //carga Accesos_Usuario
    const body = {
      tipo: 1,
      ClaveE: " ",
      ClaveU: valor,
      ClaveP: ' ', //      TipoA: nuevoEstado ? 1 : 0,
      bandera: "perfil2"
    };

    this.interaction$.next(body);

  }

  /**************************************************************************** */

  /**
   * Pa cuando seleciona un elemento de la lista desplegable con los perfiles
   */
  capturarValue(id: any) {
    this.clavePerfilGuardada.set(id)
    console.log('Valor de id : ' + id);
    /* 
     // Aquí ya tienes el ID para tu API
     const body = {
       tipo: 1,
       ClaveP: id,
       ClaveA: ' ',
       TipoA: ' ',
       bandera: "perfil"
     };
     //console.log(body);
     // 4. Enviamos al workflow para que impacte la DB y refresque la tabla
     this.interaction$.next(body);
     */

  }

  /**
   * Detecta los eventos del teclado
   */
  /* @HostListener('window:keydown', ['$event'])
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
 */
  /***********************************************************/
  /**
   * 
   * @param valor OBTENEMOS EL VALOR DEL COMBO
   */
  capturarEstatus(valor: string) {
    // 2. Guardamos la conversión en la variable global
    this.estatusNumerico = (valor === 'Inactivo' ? 0 : 1);
    console.log("Estatus guardado como número:", this.estatusNumerico);
  }

  // 3. Tu lógica de comparación con la respuesta de la API
  // Cuando recibes la respuesta de la API tras buscar un usuario
  procesarRespuesta(resp: any) {
    // 2. Tomamos el valor de la API (ejemplo: si viene 1 o "1")
    const valorAPI = resp[0].lbl_text3;

    // 3. Dejamos seleccionado el que sea igual (Sincronización)
    // Si la API trae 1, ponemos 'Activo'. Si trae 0, ponemos 'Inactivo'.
    this.estatusActualTexto = (Number(valorAPI) === 0) ? 'Activo' : 'Inactivo';

    //console.log("El combo se ha posicionado en:", this.estatusActualTexto);
  }

  procesarRespuestaEstaus(resp: any) {
    if (resp && resp[0]) {
        // 1. Limpiamos el dato de la API de cualquier espacio o salto de línea
        const perfilDesdeAPI = String(resp[0].lbl_text5) ;
 
        // 2. Buscamos la opción real dentro del combo
        const opcionEncontrada = this.opcionesCombo().find(opt => 
            String(opt.label).trim() === perfilDesdeAPI
        );        
console.log(opcionEncontrada);

        if (opcionEncontrada) {
            // 3. ¡IMPORTANTE! Asignamos el value exacto del objeto encontrado
            this.perfilSeleccionado = opcionEncontrada.value;
            console.log("¡Éxito! Perfil seleccionado:", this.perfilSeleccionado);
        } else {
            console.log("No se encontró coincidencia exacta para:", perfilDesdeAPI);
            this.perfilSeleccionado = ""; // Default
        }
        
        this.cargandoBusqueda = false;
    }
}

Guardado(){

  // 1. Obtener el ID/Key directamente de la variable vinculada
    const idPerfil = this.perfilSeleccionado; 
    // 2. Si necesitas asegurarte de que sea un NÚMERO puro:
    const idPerfilNumerico = Number(idPerfil);
    console.log(idPerfilNumerico);
    
    const body = {
      tipo: 3,
      ClaveE: this.estatusActualTexto  === 'Inactivo' ? '1' : '0',
      ClaveU: this.claveUsuario,
      ClaveP: this.perfilSeleccionado, //      TipoA: nuevoEstado ? 1 : 0,
      bandera: "perfil2"
    };
console.log(body);

    this.interaction$.next(body);
}

}