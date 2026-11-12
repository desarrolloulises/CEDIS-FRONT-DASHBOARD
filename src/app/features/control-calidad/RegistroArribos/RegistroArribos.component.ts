import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DatosService } from '../../../service/servicio.service';

import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { url } from '../../../variables';

interface RespuestaSimple {
  errId: number;
  errMsg: string;
}

interface Caja {
  codigo: string;
  folioCaja: string;
}

interface Conteo {
  cajas: Caja[];
}

interface AsnData {
  idProveedor: string;
  razonSocial: string | null;
  idCita: string;
  fechaCita: string;
  cajas: string;
  estatusArribo: string;
  ordenesCompra: string[];
  conteos: Conteo[];
}

interface ToastState {
  tipo: 'success' | 'error';
  titulo: string;
  mensaje: string;
}

@Component({
  selector: 'app-registro-arribos',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent, LoadingSpinnerComponent],
  templateUrl: './RegistroArribos.component.html',
  styleUrl: './RegistroArribos.component.css'
})
export class RegistroArribosComponent {
  private http = inject(HttpClient);
  private readonly baseUrl = `${url}/cedis/control-calidad`

  constructor(
    private datosService: DatosService
  ){}

  asnInput = '';
  datosAsn: AsnData | null = null;
  cargando = false;
  toast: ToastState | null = null;

  consultarAsn(): void {
    this.datosAsn = null;

    const asn = Number(this.asnInput);
    if (!asn) {
      this.mostrarToast('error', 'ASN inválido', 'Ingresa un ASN válido');
      return;
    }

    this.cargando = true;
    this.http.post<RespuestaSimple>(`${this.baseUrl}/validar-asn`, { asn, usuario: this.datosService.usuarioSignal() })
      .subscribe({
        next: res => {
          if (res.errId !== 0) {
            this.cargando = false;
            this.mostrarToast('error', 'ASN no válido', res.errMsg);
            return;
          }
          this.cargarDatosAsn(asn);
        },
        error: () => {
          this.cargando = false;
          this.mostrarToast('error', 'Error', 'No se pudo validar el ASN');
        }
      });
  }

  private cargarDatosAsn(asn: number): void {
    this.http.post<AsnData>(`${this.baseUrl}/obtener-datos-asn`, { asn, usuario: this.datosService.usuarioSignal() })
      .subscribe({
        next: data => {
          this.cargando = false;
          this.datosAsn = data;
        },
        error: () => {
          this.cargando = false;
          this.mostrarToast('error', 'Error', 'No se pudieron obtener los datos del ASN');
        }
      });
  }

  registrarArribo(): void {
    if (!this.datosAsn) {
      return;
    }
    const asn = Number(this.asnInput);

    this.cargando = true;
    this.http.post<RespuestaSimple>(`${this.baseUrl}/registrar-arribo`, { asn, usuario: this.datosService.usuarioSignal() })
      .subscribe({
        next: res => {
          if (res.errId !== 0) {
            this.cargando = false;
            this.mostrarToast('error', 'No se pudo registrar', res.errMsg);
            return;
          }
          // this.mostrarToast('success', 'Arribo registrado', 'El arribo se registró correctamente');
          this.cargarDatosAsn(asn);
        },
        error: () => {
          this.cargando = false;
          this.mostrarToast('error', 'Error', 'No se pudo registrar el arribo');
        }
      });
  }

  imprimirTicket(): void {
    if (!this.datosAsn) {
      return;
    }

    const payload = {
      idProveedor: this.datosAsn.idProveedor,
      razonSocial: '', // de momento se envía vacío
      fechaCita: this.datosAsn.fechaCita,
      asn: this.asnInput,
      numeroCajas: Number(this.datosAsn.cajas),
      ordenesCompra: this.datosAsn.ordenesCompra,
      conteos: this.datosAsn.conteos
    };

    this.cargando = true;
    this.http.post<RespuestaSimple>(`${this.baseUrl}/ticket-recepcion`, payload)
      .subscribe({
        next: res => {
          this.cargando = false;
          if (res.errId !== 0) {
            this.mostrarToast('error', 'No se pudo imprimir', res.errMsg);
            return;
          }
          // this.mostrarToast('success', 'Ticket generado', 'El ticket de recepción se generó correctamente');
          this.volverInicio();
        },
        error: () => {
          this.cargando = false;
          this.mostrarToast('error', 'Error', 'No se pudo generar el ticket de recepción');
        }
      });
  }

  volverInicio(): void {
    this.asnInput = '';
    this.datosAsn = null;
  }

  private mostrarToast(tipo: 'success' | 'error', titulo: string, mensaje: string): void {
    this.toast = { tipo, titulo, mensaje };
  }

  cerrarToast(): void {
    this.toast = null;
  }
}