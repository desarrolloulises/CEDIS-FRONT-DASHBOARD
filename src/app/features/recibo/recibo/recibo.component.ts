import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError, timeout } from 'rxjs';

// Tus servicios

import { ProcesosCedisService } from '../../../service/procesos-cedis.service';
import { DatosService } from '../../../service/servicio.service';
import { ExcelService } from '../../../services/excel.service';

@Component({
  selector: 'app-recibo',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './recibo.component.html',
  styleUrl: './recibo.component.css'
})
export class ReciboComponent implements OnInit {
  // --- VARIABLES 100% ORIGINALES (PARA TU HTML) ---
  public userRecivido = signal<string>(''); 
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  public fechaActualizacion = signal<Date>(new Date());
  public isWaiting = signal<boolean>(false);

  public tablaDatos = signal<any[]>([]);
  private _datosBase: any[] = []; 
  public columnasAFijar = signal<number>(2);
  public cabeceras = signal<any[]>([]);

  public camposInfo = [
    { label: 'Dato Técnico 1', valor: '' },
    { label: 'Estado Actual', valor: '' },
    { label: 'Ubicación', valor: '' },
    { label: 'Responsable', valor: '' },
    { label: 'Prioridad', valor: '' }
  ];

  constructor(
    private excelService: ExcelService,
    private http: HttpClient,
    private service: ProcesosCedisService,
    private datosService: DatosService,
  ) { }

  ngOnInit() {
    this.setupWorkflow();
  }

  /**
   * Encapsula la configuración inicial sin cambiar nombres de variables
   */
  private setupWorkflow() {
    // 1. Usuario
    const user = this.datosService.usuarioSignal();
    if (user) this.userRecivido.set(user);

    // 2. Cabeceras iniciales para que el diseño no se rompa al cargar
    this.cabeceras.set([
      { nombre: 'Folio', key: 'folio', width: 30 },
      { nombre: 'Cliente', key: 'cliente', width: 70 },
      { nombre: 'Fecha', key: 'fecha', width: 40 },
      { nombre: 'Total', key: 'total', width: 30 },
      { nombre: 'Estado', key: 'estado', width: 40 },
      { nombre: 'Chofer', key: 'chofer', width: 80 },
      { nombre: 'Unidad', key: 'unidad', width: 50 },
      { nombre: 'Destino', key: 'destino', width: 80 }
    ]);
  }

  // --- LÓGICA DE PETICIÓN ---

  consultarPorFecha() {
    this.isWaiting.set(true);

    // IMPORTANTE: Si tu db.json es { "recibo": { ... } }
    // La petición a /recibo te trae el objeto directo, NO un array.
    this.http.get<any>('http://localhost:3001/recibo').pipe(
      timeout(5000),
      catchError(err => {
        this.isWaiting.set(false);
        console.error("Error capturado:", err);
        alert("Error: El servidor Mock no responde.");
        return throwError(() => err);
      })
    ).subscribe({
      next: (resp) => {
        this.isWaiting.set(false);
        
        // Verificamos si la respuesta existe y tiene la estructura de tu db.json
        if (resp && resp.err_id === 0) {
          this.columnasAFijar.set(resp.config?.columnasAFijar || 0);
          this.cabeceras.set(resp.cabeceras || []);
          this.tablaDatos.set(resp.datos || []);
          this._datosBase = [...(resp.datos || [])];
          this.fechaActualizacion.set(new Date());
        } else {
          console.warn("Estructura inesperada:", resp);
        }
      },
      error: () => this.isWaiting.set(false)
    });
  }

  // --- MÉTODOS DE APOYO (Mantienen tu diseño) ---

  onSearchChange(event: any) {
    const valor = event.target.value.trim();
    if (!valor) {
      this.tablaDatos.set([...this._datosBase]);
      return;
    }
    if (valor.length >= 6) {
      this.consultarDetalle(valor);
    } else {
      const filtrados = this._datosBase.filter(item =>
        item.folio?.toLowerCase().includes(valor.toLowerCase())
      );
      this.tablaDatos.set(filtrados);
    }
  }

  consultarDetalle(folio: string) {
    this.camposInfo[0].valor = "REC-" + folio.toUpperCase();
    this.camposInfo[1].valor = "ACTIVO";
  }

  calcularPosicion(index: number): string {
    if (index === 0) return '0px';
    const previo = this.cabeceras()
      .slice(0, index)
      .reduce((acc, col) => acc + (col.width || 100), 0);
    return `${previo}px`;
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value.toLowerCase().trim();
    if (!filtro) {
      this.tablaDatos.set([...this._datosBase]);
    } else {
      const filtrados = this._datosBase.filter(item =>
        Object.values(item).some(val => String(val).toLowerCase().includes(filtro))
      );
      this.tablaDatos.set(filtrados);
    }
  }

  getClaseEstado(estado: string): string {
    if (!estado) return 'pendiente';
    return estado.toLowerCase().trim().replace(/\s+/g, '-');
  }

  descargarReporte() {
    this.excelService.exportToExcelCustom(this.tablaDatos(), 'Reporte_Recibo');
  }
}