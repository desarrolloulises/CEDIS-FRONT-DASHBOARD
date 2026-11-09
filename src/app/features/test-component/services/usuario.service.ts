import { Injectable, signal } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { Usuario } from '../interfaces/test.interface';

@Injectable({ providedIn: 'root' })
export class UsuarioService {

  /** Signal con el usuario actual. En producción lo poblarás desde tu auth. */
  usuario = signal<Usuario | null>(null);

  /**
   * Mock: simula leer el usuario logueado. Ajusta el rol aquí para probar
   * los distintos escenarios ('admin' | 'estandar' | 'consulta').
   */
  cargarUsuario(): Observable<Usuario> {
    const mock: Usuario = { id: 1, nombre: 'RAUL HERNANDEZ', rol: 'estandar' };
    return of(mock).pipe(delay(150));
  }
}