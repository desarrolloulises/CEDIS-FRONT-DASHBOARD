import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel

@Component({
  selector: 'app-registro-transportista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-transportista.component.html',
  styleUrls: ['./registro-transportista.component.css']
})
export class RegistroTransportistaComponent {

  // Variables de estado
  isWaiting = signal(false);
  filtroBusqueda = ""; // Vinculado a ngModel

  // Datos originales (Simulando respuesta del Xeon)
  private datosRaw = signal([
    { tipo: 'Entrega / Devolución', fecha: '22/01/2026', empresa: '3300 - Grupo moda y mas', operador: 'Victor Chafla', curp: 'CURP019910', placas: 'JW1999Z', entrada: 'Ingreso', salida: '' },
    { tipo: 'Carga / Descarga', fecha: '22/01/2026', empresa: 'Castores', operador: 'Octavio Octa', curp: 'CURP010010', placas: 'HQ891M', entrada: '', salida: 'Salida' }
  ]);

  // Tabla dinámica que reacciona al filtro
  tablaDatos = computed(() => {
    const f = this.filtroBusqueda.toLowerCase();
    return this.datosRaw().filter(d =>
      d.empresa.toLowerCase().includes(f) ||
      d.operador.toLowerCase().includes(f) ||
      d.placas.toLowerCase().includes(f)
    );
  });

  consultar() {
    this.isWaiting.set(true);
    setTimeout(() => this.isWaiting.set(false), 800);
  }

  agregarCita() {
    console.log("Abriendo flujo de nueva cita...");
  }

  verIngreso(fila: any) {
    console.log("Visualizando ingreso de:", fila.operador);
    // Aquí puedes abrir un modal con la foto de evidencia que planeamos
    alert(`Detalle de Ingreso: ${fila.operador} - Folio: ${fila.folio || 'N/A'}`);
  }

  verSalida(fila: any) {
    console.log("Visualizando salida de:", fila.operador);
    // Lógica para ver el ticket de salida o la hora registrada
    alert(`Detalle de Salida: ${fila.operador} - Placas: ${fila.placas}`);
  }

}