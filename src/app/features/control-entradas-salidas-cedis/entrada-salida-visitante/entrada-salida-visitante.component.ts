import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export type TipoVisita = 'Maniobra' | 'Candidato' | 'Servicio Externo';
export type TipoVehiculo = 'Automóvil' | 'Motocicleta' | 'Camión' | 'Camioneta' | 'Otro';

export interface Visita {
  id: number;
  tipo: TipoVisita;
  fecha: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string;
  empresa: string;
  areaQueVisita: string;
  tieneVehiculo: boolean;
  tipoVehiculo: string;
  modeloVehiculo: string;
  marcaVehiculo: string;
  placas: string;
}

export interface FormVisita extends Omit<Visita, 'id' | 'fecha'> {}

const CURP_DB: Record<string, { nombre: string; apellidoPaterno: string; apellidoMaterno: string }> = {
  'ROSG900101HMCNRL01': { nombre: 'Francisco', apellidoPaterno: 'Rosales',  apellidoMaterno: 'García' },
  'CALP850312HMCRGR05': { nombre: 'Patricio',  apellidoPaterno: 'Cargo',    apellidoMaterno: 'López' },
  'GORM900101HMCNRL01': { nombre: 'Juan',       apellidoPaterno: 'González', apellidoMaterno: 'Ramírez' },
};

const MOCK: Visita[] = [
  { id: 1, tipo: 'Maniobra',         fecha: '22/01/2026', nombre: 'Francisco', apellidoPaterno: 'Rosales',  apellidoMaterno: 'García',  curp: 'ROSG900101HMCNRL01', empresa: '',       areaQueVisita: '',                 tieneVehiculo: true,  tipoVehiculo: 'Camión',    modeloVehiculo: '2021', marcaVehiculo: 'Kenworth', placas: 'ER090A5' },
  { id: 2, tipo: 'Maniobra',         fecha: '22/01/2026', nombre: 'Patricio',  apellidoPaterno: 'Cargo',    apellidoMaterno: 'López',   curp: 'CALP850312HMCRGR05', empresa: '',       areaQueVisita: '',                 tieneVehiculo: false, tipoVehiculo: '',          modeloVehiculo: '',     marcaVehiculo: '',         placas: '' },
  { id: 3, tipo: 'Candidato',        fecha: '22/01/2026', nombre: 'Octavio',   apellidoPaterno: 'Octagon',  apellidoMaterno: 'Ruiz',    curp: 'OAOR920701HMCCTC02', empresa: '',       areaQueVisita: 'Recursos Humanos', tieneVehiculo: true,  tipoVehiculo: 'Automóvil', modeloVehiculo: '2022', marcaVehiculo: 'Susuki',   placas: 'HQ091M' },
  { id: 4, tipo: 'Maniobra',         fecha: '22/01/2026', nombre: 'Fulano',    apellidoPaterno: 'Aldo',     apellidoMaterno: 'Pérez',   curp: 'AAPF881120HMCLLD08', empresa: '',       areaQueVisita: '',                 tieneVehiculo: false, tipoVehiculo: '',          modeloVehiculo: '',     marcaVehiculo: '',         placas: '' },
  { id: 5, tipo: 'Candidato',        fecha: '22/01/2026', nombre: 'Sutano',    apellidoPaterno: 'Fernando', apellidoMaterno: 'Mora',    curp: 'MOFS910430HMCRNR09', empresa: '',       areaQueVisita: 'Recursos Humanos', tieneVehiculo: false, tipoVehiculo: '',          modeloVehiculo: '',     marcaVehiculo: '',         placas: '' },
  { id: 6, tipo: 'Servicio Externo', fecha: '22/01/2026', nombre: 'Jesús',     apellidoPaterno: 'Cristo',   apellidoMaterno: 'Salas',   curp: 'CISJ870905HMCNLS04', empresa: 'Telmex', areaQueVisita: '',                 tieneVehiculo: true,  tipoVehiculo: 'Camioneta', modeloVehiculo: '2021', marcaVehiculo: 'RAM',      placas: 'TLM001' },
  { id: 7, tipo: 'Servicio Externo', fecha: '22/01/2026', nombre: 'Alejandro', apellidoPaterno: 'Reyes',    apellidoMaterno: 'Torres',  curp: 'RETA950214HMCYNL07', empresa: 'Milano', areaQueVisita: '',                 tieneVehiculo: false, tipoVehiculo: '',          modeloVehiculo: '',     marcaVehiculo: '',         placas: '' },
];

const AREAS     = ['Recursos Humanos', 'Sistemas', 'Mantenimiento', 'Embarques', 'Recibo', 'Administración', 'Operaciones'];
const VEHICULOS: TipoVehiculo[] = ['Automóvil', 'Motocicleta', 'Camión', 'Camioneta', 'Otro'];

function hoy(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function emptyForm(): FormVisita {
  return {
    tipo: 'Maniobra', nombre: '', apellidoPaterno: '', apellidoMaterno: '', curp: '',
    empresa: '', areaQueVisita: '',
    tieneVehiculo: false, tipoVehiculo: '', modeloVehiculo: '', marcaVehiculo: '', placas: '',
  };
}

@Component({
  selector: 'app-entrada-salida-visitante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entrada-salida-visitante.component.html',
  styleUrls: ['./entrada-salida-visitante.component.css'],
})
export class EntradaSalidaVisitanteComponent implements OnInit {

  visitas: Visita[] = [];
  filtro = '';
  private nextId = 200;

  // Modal alta / edición
  showAlta    = false;
  editandoId: number | null = null;   // null = alta nueva, número = edición
  form: FormVisita = emptyForm();
  curpBloqueado = false;

  // Modal CURP
  showCURP     = false;
  consultaCURP = '';
  errorCURP    = '';

  // Modal QR
  showQR  = false;
  qrInput = '';

  readonly tipos: TipoVisita[] = ['Maniobra', 'Candidato', 'Servicio Externo'];
  readonly areas               = AREAS;
  readonly tiposVehiculo       = VEHICULOS;

  constructor(private router: Router) {}

  ngOnInit(): void { this.visitas = MOCK.map(v => ({ ...v })); }

  // ── Tabla ───────────────────────────────────────────────────────────────
  get visitasFiltradas(): Visita[] {
    const q = this.filtro.toLowerCase();
    if (!q) return this.visitas;
    return this.visitas.filter(v =>
      [v.nombre, v.apellidoPaterno, v.apellidoMaterno, v.tipo, v.empresa, v.curp, v.areaQueVisita]
        .some(f => (f || '').toLowerCase().includes(q))
    );
  }

  marcarSalida(id: number): void { this.visitas = this.visitas.filter(v => v.id !== id); }

  imprimir(v: Visita): void {
    console.log('IMPRIMIR:', { curp: v.curp, nombre: v.nombre, apellidoPaterno: v.apellidoPaterno, apellidoMaterno: v.apellidoMaterno });
  }

  // ── Formulario: alta ────────────────────────────────────────────────────
  openAlta(): void {
    this.editandoId   = null;
    this.form         = emptyForm();
    this.curpBloqueado = false;
    this.showAlta     = true;
  }

  // ── Formulario: edición ─────────────────────────────────────────────────
  openEditar(v: Visita): void {
    this.editandoId = v.id;
    // Copia todos los campos del registro al formulario
    this.form = {
      tipo:            v.tipo,
      nombre:          v.nombre,
      apellidoPaterno: v.apellidoPaterno,
      apellidoMaterno: v.apellidoMaterno,
      curp:            v.curp,
      empresa:         v.empresa,
      areaQueVisita:   v.areaQueVisita,
      tieneVehiculo:   v.tieneVehiculo,
      tipoVehiculo:    v.tipoVehiculo,
      modeloVehiculo:  v.modeloVehiculo,
      marcaVehiculo:   v.marcaVehiculo,
      placas:          v.placas,
    };
    this.curpBloqueado = false;
    this.showAlta      = true;
  }

  get modalTitulo(): string {
    return this.editandoId !== null ? 'Editar visitante' : 'Alta de visitante';
  }

  get modalBotonPrimario(): string {
    return this.editandoId !== null ? 'Guardar cambios' : 'Registrar entrada';
  }

  onChangeTipo(): void {
    this.form.empresa       = '';
    this.form.areaQueVisita = '';
  }

  onToggleVehiculo(): void {
    if (!this.form.tieneVehiculo) {
      this.form.tipoVehiculo   = '';
      this.form.modeloVehiculo = '';
      this.form.marcaVehiculo  = '';
      this.form.placas         = '';
    }
  }

  get formValido(): boolean {
    if (!this.form.nombre.trim() || !this.form.apellidoPaterno.trim()) return false;
    if (this.form.tipo === 'Servicio Externo' && !this.form.empresa.trim()) return false;
    if (this.form.tipo === 'Candidato' && !this.form.areaQueVisita) return false;
    return true;
  }

  registrar(): void {
    if (!this.formValido) return;

    if (this.editandoId !== null) {
      // Modo edición: actualizar registro existente
      this.visitas = this.visitas.map(v =>
        v.id === this.editandoId
          ? { ...v, ...this.form }
          : v
      );
    } else {
      // Modo alta: agregar nuevo registro
      this.visitas = [...this.visitas, { ...this.form, id: this.nextId++, fecha: hoy() }];
    }

    this.showAlta   = false;
    this.editandoId = null;
  }

  // ── Consulta CURP ───────────────────────────────────────────────────────
  abrirConsultaCURP(): void {
    this.consultaCURP = '';
    this.errorCURP    = '';
    this.showCURP     = true;
  }

  consultarCURP(): void {
    const curp     = this.consultaCURP.trim().toUpperCase();
    const resultado = CURP_DB[curp];

    if (resultado) {
      this.form.curp            = curp;
      this.form.nombre          = resultado.nombre;
      this.form.apellidoPaterno = resultado.apellidoPaterno;
      this.form.apellidoMaterno = resultado.apellidoMaterno;
      this.curpBloqueado        = true;
      this.showCURP             = false;
      this.consultaCURP         = '';
      this.errorCURP            = '';
    } else {
      this.errorCURP = 'No se encontró ningún registro con esa CURP.';
    }
  }

  desbloquearCURP(): void {
    this.curpBloqueado        = false;
    this.form.nombre          = '';
    this.form.apellidoPaterno = '';
    this.form.apellidoMaterno = '';
    this.form.curp            = '';
  }

  // ── QR ──────────────────────────────────────────────────────────────────
  submitQR(): void {
    console.log('CURP por QR:', this.qrInput);
    this.qrInput = '';
    this.showQR  = false;
  }

  onQRKey(e: KeyboardEvent): void { if (e.key === 'Enter' && this.qrInput.trim()) this.submitQR(); }

  irConsultar(): void { this.router.navigate(['/consultar']); }

  trackById(_: number, v: Visita): number { return v.id; }
}