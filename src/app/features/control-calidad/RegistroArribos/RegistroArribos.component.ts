import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

interface RespuestaSimple {
  errId: number;
  errMsg: string;
}

interface OrdenCompra {
  ordenCompra: string;
}

interface AsnData {
  proveedor: string;
  razonSocial: string | null;
  idCita: string;
  fechaCita: string;
  cajas: string;
  estatusArribo: string;
  ordenesCompra: OrdenCompra[];
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
  private readonly baseUrl = 'http://localhost:5242/cedis/control-calidad';

  // TODO: reemplazar
  private readonly usuario = '406991';

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
    this.http.post<RespuestaSimple>(`${this.baseUrl}/validar-asn`, { asn, usuario: this.usuario })
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
    this.http.post<AsnData>(`${this.baseUrl}/obtener-datos-asn`, { asn, usuario: this.usuario })
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
    this.http.post<RespuestaSimple>(`${this.baseUrl}/registrar-arribo`, { asn, usuario: this.usuario })
      .subscribe({
        next: res => {
          if (res.errId !== 0) {
            this.cargando = false;
            this.mostrarToast('error', 'No se pudo registrar', res.errMsg);
            return;
          }
          this.mostrarToast('success', 'Arribo registrado', 'El arribo se registró correctamente');
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

    // "ordenesCompra" y "conteos" simulados de forma temporal hasta contar con el endpoint real
    const ordenesCompraSimuladas = [
      '678912340',
      '678912341',
      '678912342',
      '678912343',
      '678912344',
      '678912345',
      '678912346',
      '678912347'
    ];

    const conteosSimulados = [
      {
        cajas: [
          { codigo: '3011', folioCaja: '0300060000002340000001' },
          { codigo: '3012', folioCaja: '0300060000002340000002' },
          { codigo: '3013', folioCaja: '0300060000002340000003' },
          { codigo: '3014', folioCaja: '0300060000002340000004' },
          { codigo: '3015', folioCaja: '0300060000002340000005' },
          { codigo: '3016', folioCaja: '0300060000002340000006' },
          { codigo: '3017', folioCaja: '0300060000002340000007' }
        ]
      },
      {
        cajas: [
          { codigo: '3011', folioCaja: '0300060000002340000001' },
          { codigo: '3012', folioCaja: '0300060000002340000002' },
          { codigo: '3013', folioCaja: '0300060000002340000003' },
          { codigo: '3014', folioCaja: '0300060000002340000004' },
          { codigo: '3015', folioCaja: '0300060000002340000005' },
          { codigo: '3016', folioCaja: '0300060000002340000006' },
          { codigo: '3017', folioCaja: '0300060000002340000007' },
          { codigo: '3018', folioCaja: '0300060000002340000008' }
        ]
      }
    ];

    const payload = {
      idProveedor: this.datosAsn.proveedor,
      razonSocial: '', // de momento se envía vacío
      fechaCita: this.datosAsn.fechaCita,
      asn: this.asnInput,
      numeroCajas: Number(this.datosAsn.cajas),
      ordenesCompra: ordenesCompraSimuladas,
      conteos: conteosSimulados
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
          this.mostrarToast('success', 'Ticket generado', 'El ticket de recepción se generó correctamente');
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