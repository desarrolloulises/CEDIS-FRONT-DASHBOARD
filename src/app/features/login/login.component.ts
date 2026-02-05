import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Importante para la navegación

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // Inyectamos el servicio de rutas de Angular 18
  private router = inject(Router);

  entrar() {
    console.log('Intentando ingresar...');
    // Por ahora, como no tenemos API, saltamos directo al inventario
    this.router.navigate(['/inventario']);
  }
}