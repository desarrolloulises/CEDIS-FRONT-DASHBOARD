import {
  Component,
  OnInit,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

interface ColorItem {
  errId: number;
  errMsg: string;
  lblIdColor: string;
  lblColor: string;
  lblBandera: string;
}

interface ColorApiResponse {
  errId: number;
  errMsg: string;
  lblIdColor: string;
  lblColor: string;
  lblBandera: string;
}

interface ToastState {
  visible: boolean;
  tipo: 'success' | 'error';
  titulo: string;
  mensaje: string;
}

@Component({
  selector: 'app-catalogo-colores',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ToastComponent, LoadingSpinnerComponent, ButtonComponent],
  templateUrl: './catalogo-colores.component.html',
  styleUrls: ['./catalogo-colores.component.css']
})
export class CatalogoColoresComponent implements OnInit {

  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5242/cedis/espacios-asignados/colores';

  // ── Estado principal ──────────────────────────────────────────────────────
  colores = signal<ColorItem[]>([]);
  cargando = signal<boolean>(false);

  // ── Nuevo color ───────────────────────────────────────────────────────────
  nuevoColor = signal<string>('#000000');
  guardandoNuevo = signal<boolean>(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast = signal<ToastState>({ visible: false, tipo: 'success', titulo: '', mensaje: '' });



  ngOnInit(): void {
    this.cargarColores();
  }

  // ── Carga ─────────────────────────────────────────────────────────────────
  cargarColores(): void {
    this.cargando.set(true);
    this.http.get<ColorItem[]>(this.baseUrl).subscribe({
      next: (data) => {
        this.colores.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarToast('error', 'Error de conexión', 'No se pudo cargar el catálogo.');
        this.cargando.set(false);
      }
    });
  }

  // ── Agregar ───────────────────────────────────────────────────────────────
  agregarColor(): void {
    const color = this.nuevoColor();
    if (!color) return;

    this.guardandoNuevo.set(true);
    this.http.post<ColorApiResponse>(this.baseUrl, { color }).subscribe({
      next: (res) => {
        this.guardandoNuevo.set(false);
        if (res.errId !== 0) {
          this.mostrarToast('error', 'Error al agregar', res.errMsg);
          return;
        }
        this.nuevoColor.set('#000000');
        this.cargarColores();
      },
      error: () => {
        this.guardandoNuevo.set(false);
        this.mostrarToast('error', 'Error de conexión', 'No se pudo agregar el color.');
      }
    });
  }

  // ── Edición directa (doble click) ─────────────
  abrirPaleta(item: ColorItem, inputEl: HTMLInputElement): void {
    inputEl.value = item.lblColor;
    inputEl.click();
  }

  guardarColorDirecto(item: ColorItem, nuevoHex: string): void {
    if (!nuevoHex || nuevoHex === item.lblColor) return;

    const body = {
      idColor: Number(item.lblIdColor),
      color: nuevoHex,
      bandera: Number(item.lblBandera)
    };

    this.http.put<ColorApiResponse>(this.baseUrl, body).subscribe({
      next: (res) => {
        if (res.errId !== 0) {
          this.mostrarToast('error', 'Error al modificar', res.errMsg);
          return;
        }
        this.cargarColores();
      },
      error: () => {
        this.mostrarToast('error', 'Error de conexión', 'No se pudo actualizar el color.');
      }
    });
  }

  // ── Toggle disponibilidad (checkbox) ─────────────────────────────────────
  toggleBandera(item: ColorItem): void {
    const nuevaBandera = item.lblBandera === '1' ? 0 : 1;
    const body = {
      idColor: Number(item.lblIdColor),
      color: item.lblColor,
      bandera: nuevaBandera
    };

    this.http.put<ColorApiResponse>(this.baseUrl, body).subscribe({
      next: (res) => {
        if (res.errId !== 0) {
          this.mostrarToast('error', 'Error', res.errMsg);
          return;
        }
        this.cargarColores();
      },
      error: () => {
        this.mostrarToast('error', 'Error de conexión', 'No se pudo cambiar el estado.');
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private mostrarToast(tipo: 'success' | 'error', titulo: string, mensaje: string): void {
    this.toast.set({ visible: true, tipo, titulo, mensaje });
  }

  cerrarToast(): void {
    this.toast.update(t => ({ ...t, visible: false }));
  }
}