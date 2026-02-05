import { inject, Inject, Injectable, NgZone, PLATFORM_ID, signal } from "@angular/core";
import { ElementoTexto } from "../interfaces/ipallet";
import { isPlatformBrowser } from "@angular/common";

@Injectable({
  providedIn: "root",
})
//--------------------------------------------------------------------------------------------------------
// para login usuario pasar por cada componente
export class DatosService {
  // 1. Declaramos la Signal (reemplaza a _datos)
  // La iniciamos vacía o con el valor que desees
  public usuarioSignal = signal<string>(''); 

  constructor() { }

  // 2. Método para actualizar el dato (reemplaza a agregarDato)
  actualizarUsuario(nuevoUsuario: string) {
    this.usuarioSignal.set(nuevoUsuario);
  }
}
//-----------------------------------------------------------------------------------------------------------------
//para varios datos
export class variosDatos {

  private _datos: string[] = []

  constructor() { }

  get datos() {
    return [...this._datos]; //encapsular
  }
  //metodo para agregar dato
  agregarData(dato: string) {
    this._datos.push(dato);
  }
  ///
  /* Método para agregar múltiples datos de golpe
  agregarArregloDatos(nuevosDatos: string[]) {
    nuevosDatos.forEach(item => {
      // Aquí puedes aplicar validaciones antes de guardar
      if (item !== '') {
        this.agregarDato(item);
      }
    });
  }*/
}
//-----------------------------------------------------------------

// Creamos una señal que guarda el arreglo
export class DatosServiceSignal {
  // Creamos una señal que guarda el arreglo
  public misDatosSignal = signal<ElementoTexto[]>([]);

  constructor() { }
}

//--------------------------------------------------------------------------------------------------------
// Servicio para manejar la vibración del dispositivo
/*export class VibrationService {
  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone); // Inyectamos NgZone

  trigger(pattern: number | number[] = 100): void {
    // Verificamos que estamos en el navegador y que la API existe
    if (isPlatformBrowser(this.platformId) && 'vibrate' in navigator) {
      this.zone.runOutsideAngular(() => {
        navigator.vibrate(pattern);
        console.log("vibracion");
      });                                             
    } else {
      console.warn('Vibration API no soportada o ejecutándose en servidor');
    }
  }
}*/




