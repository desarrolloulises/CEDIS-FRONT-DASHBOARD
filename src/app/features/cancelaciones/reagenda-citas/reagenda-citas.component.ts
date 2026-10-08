import {
    Component, signal, HostListener, OnInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { finalize, switchMap, of } from 'rxjs';
import * as XLSX from 'xlsx';

import { DatosService } from '../../../service/servicio.service';
import { DatosFolioItem, CambioSolicitud } from './interface/reagenda-citas.interface';
import { ReagendaCitasService } from './service/reagenda-citas.service';

// ─────────────────────────────────────────────────────────────
// Tipos internos
// ─────────────────────────────────────────────────────────────

type EstadoFlujo =
    | 'inicial'         // sin folio
    | 'folio-generado'  // folio nuevo, aún sin datos
    | 'con-datos';      // hay datos consultados (estatusEnc 0 o 3)

// ─────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────

@Component({
    standalone: true,
    selector: 'reagenda-citas-component',
    templateUrl: './reagenda-citas.component.html',
    styleUrl: './reagenda-citas.component.css',
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ButtonComponent,
        ToastComponent,
        LoadingSpinnerComponent
    ]
})
export class ReagendaCitasComponent implements OnInit {

    // ── Estado UI ───────────────────────────────────────────────
    cargando = signal<boolean>(false);
    exportando = signal<boolean>(false);
    importando = signal<boolean>(false);
    generandoFolio = signal<boolean>(false);

    toastVisible = signal<boolean>(false);
    toastTipo = signal<'success' | 'error'>('success');
    toastTitulo = signal<string>('');
    toastMensaje = signal<string>('');

    // ── Flujo ───────────────────────────────────────────────────
    estado = signal<EstadoFlujo>('inicial');
    folio = signal<number | null>(null);
    folioBloqueado = signal<boolean>(false);   // true cuando viene del endpoint "generar folio"
    estatusEnc = signal<number | null>(null);  // 0 = editable, 3 = confirmado
    nombreArchivo = signal<string>('');

    // ── Datos dinámicos ─────────────────────────────────────────
    filas = signal<DatosFolioItem[]>([]);
    filtro = signal<string>('');

    // ── Referencias ─────────────────────────────────────────────
    private archivoInput!: HTMLInputElement;

    private service = inject(ReagendaCitasService);
    private datosService = inject(DatosService);

    ngOnInit(): void {
        this.archivoInput = document.createElement('input');
        this.archivoInput.type = 'file';
        this.archivoInput.accept = '.xlsx,.xls,.csv';
        this.archivoInput.style.display = 'none';
        this.archivoInput.addEventListener('change', (e) => this.onArchivoSeleccionado(e));
        document.body.appendChild(this.archivoInput);
    }

    // ── Helpers de usuario ─────────────────────────────────────
    private get usuario(): string {
        const u = this.datosService.usuarioSignal();
        return u ? String(u) : '';
    }

    // ── Computed ────────────────────────────────────────────────
    get filasFiltradas(): DatosFolioItem[] {
        const f = this.filtro().toLowerCase().trim();
        if (!f) return this.filas();
        return this.filas().filter(fila =>
            Object.values(fila).some(v =>
                String(v ?? '').toLowerCase().includes(f)
            )
        );
    }

    get puedeEditar(): boolean {
        return this.estatusEnc() === 0;
    }

    get puedeExportar(): boolean {
        return this.estatusEnc() === 3 && this.filas().length > 0;
    }

    get puedeImportar(): boolean {
        // Se puede importar si tenemos folio y (estatusEnc 0 o 3)
        return this.folio() !== null && this.estatusEnc() !== null;
    }

    // ─────────────────────────────────────────────────────────────
    // 1. GENERAR FOLIO
    // ─────────────────────────────────────────────────────────────
    generarFolio(): void {
        if (!this.usuario) {
            this.mostrarToast('error', 'Validación', 'No se encontró el usuario en sesión');
            return;
        }

        this.generandoFolio.set(true);
        this.toastVisible.set(false);

        this.service.generarFolio(this.usuario)
            .pipe(finalize(() => this.generandoFolio.set(false)))
            .subscribe({
                next: (resp) => {
                    if (resp.success && resp.data) {
                        const folio = Number(resp.data.folio);
                        this.folio.set(folio);
                        this.folioBloqueado.set(true);
                        this.estatusEnc.set(0);   // recién generado → editable
                        this.filas.set([]);
                        this.estado.set('folio-generado');
                        //this.mostrarToast('success', 'Folio generado',
                        //    `Folio ${folio} asignado. Puedes importar el Excel.`);
                    } else {
                        this.mostrarToast('error', 'Error',
                            resp.error || 'No se pudo generar el folio');
                    }
                },
                error: () => this.mostrarToast('error', 'Error',
                    'No se pudo conectar con el servidor')
            });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. CONSULTAR DATOS (folio ingresado manualmente)
    // ─────────────────────────────────────────────────────────────
    consultarFolio(): void {
        const folio = this.folio();
        if (folio === null || folio === undefined) {
            this.mostrarToast('error', 'Validación', 'Ingresa un folio');
            return;
        }

        if (!this.usuario) {
            this.mostrarToast('error', 'Validación', 'No se encontró el usuario en sesión');
            return;
        }

        this.cargando.set(true);
        this.toastVisible.set(false);

        this.service.consultarDatosFolio(folio, this.usuario)
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: (resp) => {
                    if (!resp.success || !resp.data) {
                        this.mostrarToast('error', 'Error',
                            resp.error || 'No se pudieron obtener los datos del folio');
                        return;
                    }

                    this.aplicarDatosFolio(resp.data.jsalida, resp.data.estatusEnc);
                    this.estado.set('con-datos');
                    this.folioBloqueado.set(true);

                    // this.mostrarToast('success', 'Consulta exitosa',
                    //     `${resp.data.jsalida.length} registro(s) cargado(s).`);
                },
                error: () => this.mostrarToast('error', 'Error',
                    'No se pudo conectar con el servidor')
            });
    }

    private aplicarDatosFolio(items: DatosFolioItem[], estatusEnc: number): void {
        this.estatusEnc.set(Number(estatusEnc));
        this.filas.set(items ?? []);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. IMPORTAR EXCEL + GUARDAR
    // ─────────────────────────────────────────────────────────────
    abrirSelectorArchivo(): void {
        if (this.folio() === null) {
            this.mostrarToast('error', 'Sin folio',
                'Genera o consulta un folio antes de importar.');
            return;
        }
        this.archivoInput.value = '';
        this.archivoInput.click();
    }

    private async onArchivoSeleccionado(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const folio = this.folio();
        if (folio === null) return;

        this.importando.set(true);

        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
            const sheet = wb.Sheets[wb.SheetNames[0]];

            const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
                header: 1,
                raw: true,
                blankrows: false
            });

            const cambios = this.parsearCambios(rows);

            if (cambios.length === 0) {
                this.mostrarToast('error', 'Archivo vacío',
                    'No se encontraron filas válidas (ASN, Fecha solicitada).');
                this.importando.set(false);
                return;
            }

            this.nombreArchivo.set(file.name);

            // Guardar automáticamente
            this.service.guardarSolicitud(folio, this.usuario, cambios)
                .pipe(finalize(() => this.importando.set(false)))
                .subscribe({
                    next: (resp) => {
                        if (resp.success && resp.data?.guardado) {
                            // Mostrar los datos de la hoja en la tabla
                            this.filas.set(cambios.map(c => ({
                                ASN: c.asn,
                                FechaCita: c.fechaNueva,
                                Cita: 0,
                                FechaSubida: '',
                                Observaciones: '',
                                EstatusValidacion: 0 // pendiente de validar
                            })));
                            this.estatusEnc.set(0);
                            this.estado.set('con-datos');
                            // this.mostrarToast('success', 'Datos guardados',
                            //     `${cambios.length} solicitud(es) guardada(s).`);
                        } else {
                            this.mostrarToast('error', 'Error',
                                resp.error || 'No se pudieron guardar las solicitudes');
                        }
                    },
                    error: () => this.mostrarToast('error', 'Error',
                        'No se pudo conectar con el servidor')
                });

        } catch (e) {
            console.error(e);
            this.mostrarToast('error', 'Error al leer el archivo',
                'Verifica que el archivo sea un Excel válido.');
            this.importando.set(false);
        } finally {
            input.value = '';
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. VALIDAR SOLICITUDES
    // ─────────────────────────────────────────────────────────────
    validarSolicitudes(): void {
        const folio = this.folio();
        if (folio === null) return;

        this.cargando.set(true);

        this.service.validarSolicitudes(folio, this.usuario)
            .pipe(
                switchMap((resp) => {
                    if (!resp.success || !resp.data?.validado) {
                        this.mostrarToast('error', 'Error',
                            resp.error || 'No se pudieron validar las solicitudes');
                        return of(null);
                    }
                    // En automático consultamos los datos del folio
                    return this.service.consultarDatosFolio(folio, this.usuario);
                }),
                finalize(() => this.cargando.set(false))
            )
            .subscribe({
                next: (resp) => {
                    if (!resp) return;   // ya se mostró toast de error
                    if (!resp.success || !resp.data) {
                        this.mostrarToast('error', 'Error',
                            resp.error || 'No se pudieron obtener los datos tras la validación');
                        return;
                    }

                    this.aplicarDatosFolio(resp.data.jsalida, resp.data.estatusEnc);
                    this.estado.set('con-datos');
                    // this.mostrarToast('success', 'Validación',
                    //     'Solicitudes validadas. Revisa los resultados.');
                },
                error: () => this.mostrarToast('error', 'Error',
                    'No se pudo conectar con el servidor')
            });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. CONFIRMAR + APLICAR CAMBIOS
    // ─────────────────────────────────────────────────────────────
    confirmarCambios(): void {
        const folio = this.folio();
        if (folio === null) return;

        this.cargando.set(true);

        this.service.confirmarCambios(folio, this.usuario)
            .pipe(
                switchMap((resp) => {
                    if (!resp.success || !resp.data?.confirmado) {
                        this.mostrarToast('error', 'Error',
                            resp.error || 'No se pudieron confirmar los cambios');
                        return of(null);
                    }
                    // Reconsultamos para actualizar estatusEnc
                    return this.service.consultarDatosFolio(folio, this.usuario);
                }),
                finalize(() => this.cargando.set(false))
            )
            .subscribe({
                next: (resp) => {
                    if (!resp) return;
                    if (!resp.success || !resp.data) {
                        this.mostrarToast('error', 'Error',
                            resp.error || 'No se pudieron obtener los datos tras la confirmación');
                        return;
                    }

                    this.aplicarDatosFolio(resp.data.jsalida, resp.data.estatusEnc);
                    this.estado.set('con-datos');
                    // this.mostrarToast('success', 'Confirmado',
                    //     'Cambios aplicados. Ya puedes exportar la información.');
                },
                error: () => this.mostrarToast('error', 'Error',
                    'No se pudo conectar con el servidor')
            });
    }

    // ─────────────────────────────────────────────────────────────
    // Parseo de Excel
    // ─────────────────────────────────────────────────────────────
    private parsearCambios(rows: unknown[][]): CambioSolicitud[] {
        const out: CambioSolicitud[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const folioRaw = row[0];
            const fechaRaw = row[1];

            if (i === 0) {
                const esFolioNumerico = Number.isFinite(Number(folioRaw));
                if (!esFolioNumerico) continue;
            }

            const folio = Number(folioRaw);
            if (!Number.isFinite(folio) || folio <= 0) continue;

            const fecha = this.parsearFechaString(fechaRaw);
            if (!fecha) continue;

            out.push({ asn: folio, fechaNueva: fecha });
        }

        return out;
    }

    private parsearFechaString(v: unknown): string | null {
        if (v === null || v === undefined || v === '') return null;

        if (v instanceof Date) {
            return isNaN(v.getTime()) ? null : this.toFechaISO(v);
        }

        if (typeof v === 'number') {
            const ms = Math.round((v - 25569) * 86400 * 1000);
            const d = new Date(ms);
            return isNaN(d.getTime()) ? null : this.toFechaISOUTC(d);
        }

        const s = String(v).trim();
        if (!s) return null;

        const mDMY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (mDMY) {
            const [, dd, mm, yyyyRaw] = mDMY;
            const yyyy = yyyyRaw.length === 2 ? `20${yyyyRaw}` : yyyyRaw;
            return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }

        const mISO = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (mISO) return `${mISO[1]}-${mISO[2]}-${mISO[3]}`;

        const d = new Date(s);
        return isNaN(d.getTime()) ? null : this.toFechaISO(d);
    }

    private toFechaISO(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    private toFechaISOUTC(d: Date): string {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    // ─────────────────────────────────────────────────────────────
    // EXPORTAR
    // ─────────────────────────────────────────────────────────────
    async exportarExcel(): Promise<void> {
        if (this.exportando()) return;

        const folio = this.folio();
        if (folio === null || this.filas().length === 0) {
            this.mostrarToast('error', 'Error', 'No hay datos para exportar');
            return;
        }

        this.exportando.set(true);
        try {
            await new Promise(r => setTimeout(r, 50));

            const nombreArchivo = `reagenda_folio-${folio}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            this.generarExcel(this.filasFiltradas, folio, nombreArchivo);

        } catch (e) {
            console.error(e);
            this.mostrarToast('error', 'Error', 'Ocurrió un error al exportar');
        } finally {
            await new Promise(r => setTimeout(r, 200));
            this.exportando.set(false);
        }
    }

    private generarExcel(
        filas: DatosFolioItem[],
        folio: number,
        nombre: string
    ): void {
        const encabezados = [
            'ASN',
            'Fecha Cita',
            'Cita',
            'Fecha Subida',
            'Observaciones',
            'Estatus Validación'
        ];

        const data = filas.map(f => [
            f.ASN,
            f.FechaCita,
            f.Cita,
            f.FechaSubida,
            f.Observaciones,
            this.textoEstatusValidacion(f.EstatusValidacion)
        ]);

        const ws = XLSX.utils.aoa_to_sheet([encabezados, ...data]);

        // Forzar formato texto en columnas de fecha
        ['B', 'D'].forEach(colLetter => {
            for (let r = 2; r <= filas.length + 1; r++) {
                const cellRef = `${colLetter}${r}`;
                const cell = ws[cellRef];
                if (cell) { cell.t = 's'; cell.z = '@'; }
            }
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Folio ${folio}`);

        // Insertar el folio como metadato al inicio
        XLSX.utils.sheet_add_aoa(ws, [[`Folio: ${folio}`]], { origin: 'A1' });
        // Reajustar: mover todo una fila abajo
        // (más simple: crear hoja con la fila del folio primero)
        const wsFinal = XLSX.utils.aoa_to_sheet([
            [`Folio: ${folio}`],
            [],
            encabezados,
            ...data
        ]);
        wb.Sheets[wb.SheetNames[0]] = wsFinal;

        XLSX.writeFile(wb, nombre);
    }

    private textoEstatusValidacion(v: number): string {
        if (v === 1) return 'Cambio no válido';
        if (v === 2) return 'Cambio válido';
        return '';
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers de template
    // ─────────────────────────────────────────────────────────────
    textoEstatus(v: number): string {
        return this.textoEstatusValidacion(v);
    }

    // ─────────────────────────────────────────────────────────────
    // Limpieza
    // ─────────────────────────────────────────────────────────────
    limpiar(): void {
        this.folio.set(null);
        this.folioBloqueado.set(false);
        this.estatusEnc.set(null);
        this.filas.set([]);
        this.filtro.set('');
        this.nombreArchivo.set('');
        this.estado.set('inicial');
        this.toastVisible.set(false);
        this.focusFolio();
    }

    // ─────────────────────────────────────────────────────────────
    // Toast
    // ─────────────────────────────────────────────────────────────
    private mostrarToast(
        tipo: 'success' | 'error' | 'info',
        titulo: string,
        mensaje: string
    ): void {
        this.toastTipo.set(tipo === 'info' ? 'success' : tipo);
        this.toastTitulo.set(titulo);
        this.toastMensaje.set(mensaje);
        this.toastVisible.set(true);
    }

    // ─────────────────────────────────────────────────────────────
    // Atajos de teclado
    // ─────────────────────────────────────────────────────────────
    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'F2') {
            event.preventDefault();
            if (this.folioBloqueado() && this.estatusEnc() === 0) {
                this.abrirSelectorArchivo();
            } else {
                this.focusFolio();
            }
        }
        if (event.key === 'Enter' && document.activeElement?.id === 'folioInput') {
            event.preventDefault();
            if (!this.folioBloqueado()) this.consultarFolio();
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
            event.preventDefault();
            if (this.puedeExportar) this.exportarExcel();
        }
    }

    private focusFolio(): void {
        document.querySelector<HTMLInputElement>('#folioInput')?.focus();
    }

    // ─────────────────────────────────────────────────────────────
    // Input de folio: manejo manual
    // ─────────────────────────────────────────────────────────────
    onFolioInputChange(valor: string): void {
        const n = Number(valor);
        this.folio.set(Number.isFinite(n) && n > 0 ? n : null);
    }
}