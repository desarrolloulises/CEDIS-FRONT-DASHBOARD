import { Component, signal, Output, EventEmitter, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { InputComponent } from "../../../shared/components/input/input.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { ToastComponent } from "../../../shared/components/toast/toast.component";
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { finalize } from "rxjs/operators";

// Interface para tipar la respuesta
interface DetallePallet {
    pallet: string;
    ubicacion: string;
    cajas_pallet: number;
    cajas_a_reasignar: number;
}

interface ApiResponse<T> {
    success: boolean;
    error: string;
    code: string;
    data: T[] | null;
}

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
    // URL del endpoint
    private readonly API_URL = 'http://192.168.102.81:5242/cedis/consulta-reasignacion/obtener-detalle-pallets';
    private readonly USUARIO = '406991'; 

    // Estado de carga y toast
    cargando = signal<boolean>(false);
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

    constructor(private http: HttpClient) { }

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
        // Validar que los campos estén completos
        if (!this.numeroLoteInput() || !this.destinoAnteriorInput()) {
            this.mostrarToast('error', 'Validación', 'Debe ingresar el número de lote y el destino anterior');
            return;
        }

        const numeroLote = parseInt(this.numeroLoteInput());
        const destinoAnterior = parseInt(this.destinoAnteriorInput());

        if (isNaN(numeroLote) || isNaN(destinoAnterior)) {
            this.mostrarToast('error', 'Validación', 'Los valores ingresados deben ser numéricos');
            return;
        }

        this.cargando.set(true);
        this.toastVisible.set(false);

        const body = {
            numero_lote: numeroLote,
            destino_anterior: destinoAnterior,
            usuario: this.USUARIO
        };

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': '*/*'
        });

        this.http.post<ApiResponse<DetallePallet>>(this.API_URL, body, { headers })
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
    }
}