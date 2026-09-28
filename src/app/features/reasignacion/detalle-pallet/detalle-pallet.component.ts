import { Component, signal, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { InputComponent } from "../../../shared/components/input/input.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { ToastComponent } from "../../../shared/components/toast/toast.component";
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component";
import { finalize } from "rxjs/operators";
import { DatosService } from "../../../service/servicio.service";
import { DetallePalletService } from './services/detalle-pallet.service';
import { DetallePallet, DetallePalletRequest } from './interfaces/detalle-pallet.interface';
import { exportarDetallePalletsExcel } from './utils/excel-export';

@Component({
    standalone: true,
    selector: 'detalle-pallet-component',
    templateUrl: './detalle-pallet.component.html',
    styleUrl: './detalle-pallet.component.css',
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ButtonComponent,
        ToastComponent,
        LoadingSpinnerComponent
    ]
})
export class DetallePalletComponent {
    // Estado de carga y toast
    cargando = signal<boolean>(false);
    exportando = signal<boolean>(false);
    toastVisible = signal<boolean>(false);
    toastTipo = signal<'success' | 'error'>('success');
    toastTitulo = signal<string>('');
    toastMensaje = signal<string>('');

    // Datos
    detallePallets = signal<DetallePallet[]>([]);

    // Inputs del formulario
    numeroLoteInput = signal<string>('');
    destinoAnteriorInput = signal<string>('');

    // Filtro de búsqueda
    filtro = signal<string>('');

    // Estado para controlar si ya se ha consultado
    haConsultado = signal<boolean>(false);

    constructor(
        private detallePalletService: DetallePalletService,
        private datosService: DatosService
    ) { }

    // Computed para filtrar los datos
    get palletsFiltrados() {
        const filtro = this.filtro().toLowerCase().trim();
        const datos = this.detallePallets();

        if (!filtro) return datos;

        return datos.filter(item => {
            return (
                item.pallet.toLowerCase().includes(filtro) ||
                item.ubicacion.toLowerCase().includes(filtro) ||
                item.cajas_pallet.toString().includes(filtro) ||
                item.cajas_a_reasignar.toString().includes(filtro)
            );
        });
    }

    // Método para consultar el detalle de pallets
    consultarDetallePallets(): void {
        if (!this.numeroLoteInput()) {
            this.mostrarToast('error', 'Validación', 'Debe ingresar el folio');
            return;
        }

        const numeroLote = parseInt(this.numeroLoteInput());

        if (isNaN(numeroLote)) {
            this.mostrarToast('error', 'Validación', 'El folio debe ser numérico');
            return;
        }

        let destinoAnterior: number | null = null;
        if (this.destinoAnteriorInput() !== null &&
            this.destinoAnteriorInput() !== undefined &&
            String(this.destinoAnteriorInput()).trim() !== '') {
            destinoAnterior = parseInt(this.destinoAnteriorInput()!);
            if (isNaN(destinoAnterior)) {
                this.mostrarToast('error', 'Validación', 'La tienda debe ser numérica');
                return;
            }
        }

        this.cargando.set(true);
        this.toastVisible.set(false);

        const request: DetallePalletRequest = {
            numero_lote: numeroLote,
            destino_anterior: destinoAnterior,
            usuario: this.datosService.usuarioSignal()
        };

        this.detallePalletService.obtenerDetallePallets(request)
            .pipe(
                finalize(() => this.cargando.set(false))
            )
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.detallePallets.set(response.data);
                        this.filtro.set('');
                        this.haConsultado.set(true);

                        if (response.data.length === 0) {
                            this.mostrarToast('info', 'Información', 'No se encontraron pallets para este detalle');
                        }
                    } else {
                        this.detallePallets.set([]);
                        this.haConsultado.set(false);
                        this.mostrarToast('error', 'Error', response.error || 'Ocurrió un error al cargar el detalle de pallets');
                    }
                },
                error: (error) => {
                    console.error('Error al cargar detalle de pallets:', error);
                    this.detallePallets.set([]);
                    this.haConsultado.set(false);
                    this.mostrarToast('error', 'Error', 'No se pudo conectar con el servidor');
                }
            });
    }

    async exportarExcel(): Promise<void> {
        // Verificar si ya hay una exportación en progreso
        if (this.exportando()) {
            return; // Simplemente ignorar si ya está exportando
        }

        const datos = this.palletsFiltrados;

        if (datos.length === 0) {
            this.mostrarToast('error', 'Error', 'No hay datos para exportar');
            return;
        }

        // Activar el estado de exportación
        this.exportando.set(true);

        try {
            // Dar tiempo al navegador para renderizar el spinner
            await new Promise(resolve => setTimeout(resolve, 50));

            // Exportar usando la utilidad
            exportarDetallePalletsExcel(
                datos,
                this.numeroLoteInput(),
                this.destinoAnteriorInput() || 'todas'
            );

        } catch (error) {
            console.error('Error al exportar:', error);
            this.mostrarToast('error', 'Error', 'Ocurrió un error al exportar los datos');
        } finally {
            await new Promise(resolve => setTimeout(resolve, 200));
            this.exportando.set(false);
        }
    }

    // Método para limpiar el formulario
    limpiarFormulario(): void {
        this.numeroLoteInput.set('');
        this.destinoAnteriorInput.set('');
        this.filtro.set('');
        this.detallePallets.set([]);
        this.haConsultado.set(false);
        this.toastVisible.set(false);
    }

    // Método para limpiar filtro
    limpiarFiltro(): void {
        this.filtro.set('');
    }

    // Método helper para mostrar toast
    private mostrarToast(tipo: 'success' | 'error' | 'info', titulo: string, mensaje: string): void {
        this.toastTipo.set(tipo === 'info' ? 'success' : tipo);
        this.toastTitulo.set(titulo);
        this.toastMensaje.set(mensaje);
        this.toastVisible.set(true);
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'F2') {
            event.preventDefault();
            document.querySelector<HTMLInputElement>('.search-container input')?.focus();
        }

        // Atajo Ctrl + E para exportar
        if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
            event.preventDefault();
            this.exportarExcel();
        }
    }
}