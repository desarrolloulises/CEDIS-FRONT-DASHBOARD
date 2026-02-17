import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importa tu servicio donde está la signal del usuario
import { DatosService } from '../../service/servicio.service';


export interface ICardData {
  titulo: string;
  valor: string | number;
  icono: string;
  color: string;
}
@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [],
  templateUrl: './summary-cards.component.html',
  styleUrl: './summary-cards.component.css'
})

export class SummaryCardsComponent {
  private authService = inject(DatosService);

  // Creamos una Signal computada para las tarjetas
  // Se actualizará automáticamente si la signal del usuario cambia
  public cards = computed<ICardData[]>(() => {
    const usuario = this.authService.usuarioSignal(); // Tu signal actual
    console.log("user " + usuario);
    
    
    return [
      {
        titulo: 'Usuario Activo',
        valor: usuario || 'No identificado',
        icono: 'fas fa-user-circle',
        color: '#4e73df'
      },
      {
        titulo: 'Estatus Sistema',
        valor: 'En línea',
        icono: 'fas fa-check-circle',
        color: '#1cc88a'
      },
      {
        titulo: 'Sesión',
        valor: 'Activa',
        icono: 'fas fa-clock',
        color: '#f6c23e'
      }
    ];
  });
}
