import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recibo',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './recibo.component.html',
  styleUrl: './recibo.component.css'
})
export class ReciboComponent {
  // En tu componente .ts
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];


  public tablaDatos = [
    { id: 1, folio: 'FAC-001', cliente: 'Logística SA', fecha: '2023-10-24', total: '$1,200', estado: 'Entregado', chofer: 'Juan Pérez', unidad: 'Eco-05', destino: 'CDMX' },
    { id: 2, folio: 'FAC-002', cliente: 'Surtidora Global', fecha: '2023-10-25', total: '$3,500', estado: 'En Ruta', chofer: 'Luis Gomez', unidad: 'Eco-12', destino: 'Guadalajara' },
    { id: 3, folio: 'FAC-003', cliente: 'Tiendas Neto', fecha: '2023-10-25', total: '$850', estado: 'Pendiente', chofer: 'Sin Asignar', unidad: 'N/A', destino: 'Toluca' },
    { id: 4, folio: 'FAC-004', cliente: 'Abarrotes Luis', fecha: '2023-10-26', total: '$2,100', estado: 'Cancelado', chofer: 'Pedro Paez', unidad: 'Eco-03', destino: 'Puebla' },
    { id: 5, folio: 'FAC-005', cliente: 'Carnes de Norte', fecha: '2023-10-26', total: '$5,400', estado: 'Entregado', chofer: 'Raul Sosa', unidad: 'Eco-08', destino: 'Monterrey' },
    { id: 6, folio: 'FAC-001', cliente: 'Logística SA', fecha: '2023-10-24', total: '$1,200', estado: 'Entregado', chofer: 'Juan Pérez', unidad: 'Eco-05', destino: 'CDMX' },
    { id: 7, folio: 'FAC-002', cliente: 'Surtidora Global', fecha: '2023-10-25', total: '$3,500', estado: 'En Ruta', chofer: 'Luis Gomez', unidad: 'Eco-12', destino: 'Guadalajara' },
    { id: 8, folio: 'FAC-003', cliente: 'Tiendas Neto', fecha: '2023-10-25', total: '$850', estado: 'Pendiente', chofer: 'Sin Asignar', unidad: 'N/A', destino: 'Toluca' },
    { id: 9, folio: 'FAC-004', cliente: 'Abarrotes Luis', fecha: '2023-10-26', total: '$2,100', estado: 'Cancelado', chofer: 'Pedro Paez', unidad: 'Eco-03', destino: 'Puebla' },
    { id: 10, folio: 'FAC-005', cliente: 'Carnes de Norte', fecha: '2023-10-26', total: '$5,400', estado: 'Entregado', chofer: 'Raul Sosa', unidad: 'Eco-08', destino: 'Monterrey' },
  
    { id: 11, folio: 'FAC-001', cliente: 'Logística SA', fecha: '2023-10-24', total: '$1,200', estado: 'Entregado', chofer: 'Juan Pérez', unidad: 'Eco-05', destino: 'CDMX' },
    { id: 12, folio: 'FAC-002', cliente: 'Surtidora Global', fecha: '2023-10-25', total: '$3,500', estado: 'En Ruta', chofer: 'Luis Gomez', unidad: 'Eco-12', destino: 'Guadalajara' },
    { id: 13, folio: 'FAC-003', cliente: 'Tiendas Neto', fecha: '2023-10-25', total: '$850', estado: 'Pendiente', chofer: 'Sin Asignar', unidad: 'N/A', destino: 'Toluca' },
    { id: 14, folio: 'FAC-004', cliente: 'Abarrotes Luis', fecha: '2023-10-26', total: '$2,100', estado: 'Cancelado', chofer: 'Pedro Paez', unidad: 'Eco-03', destino: 'Puebla' },
    { id: 15, folio: 'FAC-005', cliente: 'Carnes de Norte', fecha: '2023-10-26', total: '$5,400', estado: 'Entregado', chofer: 'Raul Sosa', unidad: 'Eco-08', destino: 'Monterrey' },
  
  ];

  // Hardcode inicial de los 5 campos para el esqueleto
  camposInfo = [
    { label: 'Dato Técnico 1', valor: '' },
    { label: 'Estado Actual', valor: '' },
    { label: 'Ubicación', valor: '' },
    { label: 'Responsable', valor: '' },
    { label: 'Prioridad', valor: '' }
  ];

  // Acción 1: Calendario
  consultarPorFecha() {
    console.log("Consultando API con fecha:", this.fechaSeleccionada);
    // Aquí llenarías this.datosTabla
  }

  // Acción 2: Filtro Independiente (al terminar de escribir)
  onSearchChange(event: any) {
    const valor = event.target.value;
    if (valor.length > 6) { // Ejemplo: disparar después de 3 caracteres
      this.consultarDetalle(valor);
    }
  }

  consultarDetalle(id: string) {
    console.log("Consultando detalle de:", id);
    // Simulación de API llenando los 5 campos
    this.camposInfo[0].valor = "Valor desde API";
    // ... etc
  }



  getClaseEstado(estado: string): string {
    if (!estado) return 'pendiente'; // Valor por defecto
    return estado.toLowerCase().trim().replace(/\s+/g, '-');
  }
}