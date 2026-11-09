import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import {
  Catalogo, CatalogoData, FilaCatalogo, PermisosCatalogo, RolUsuario
} from '../interfaces/test.interface';

@Injectable({ providedIn: 'root' })
export class CatalogoService {

  // ── Catálogos visibles por rol ────────────────────────────────
  private catalogosPorRol: Record<RolUsuario, Catalogo[]> = {
    admin: [
      { id: 'proveedores', nombre: 'Proveedores' },
      { id: 'empleados',   nombre: 'Empleados' },
      { id: 'unidades',    nombre: 'Unidades' }
    ],
    estandar: [
      { id: 'proveedores', nombre: 'Proveedores' },
      { id: 'empleados',   nombre: 'Empleados' }
    ],
    consulta: [
      { id: 'proveedores', nombre: 'Proveedores' }
    ]
  };

  // ── Matriz de permisos (rol × catálogo) ───────────────────────
  // Aquí es donde vive la autorización real. Los datos NO cambian
  // por rol; lo que cambia son estos permisos.
  private permisosPorRol: Record<RolUsuario, Record<string, PermisosCatalogo>> = {
    admin: {
      proveedores: { puedeAgregar: true,  puedeEliminar: true,  columnasNoEditables: ['Id', 'RFC'] },
      empleados:   { puedeAgregar: true,  puedeEliminar: true,  columnasNoEditables: ['Id'] },
      unidades:    { puedeAgregar: true,  puedeEliminar: true,  columnasNoEditables: ['Id'] }
    },
    estandar: {
      proveedores: { puedeAgregar: true,  puedeEliminar: false, columnasNoEditables: ['Id', 'RFC', 'Activo'] },
      empleados:   { puedeAgregar: true,  puedeEliminar: false, columnasNoEditables: ['Id'] }
      // 'unidades' no está: el rol no ve ese catálogo.
    },
    consulta: {
      proveedores: { puedeAgregar: false, puedeEliminar: false, columnasNoEditables: ['Id', 'RFC', 'RazonSocial', 'Activo'] }
      // Todo bloqueado: solo lectura.
    }
  };

  obtenerCatalogosPorRol(rol: RolUsuario): Observable<Catalogo[]> {
    return of(this.catalogosPorRol[rol] ?? []).pipe(delay(150));
  }

  /**
   * Devuelve datos + permisos resueltos para el rol indicado.
   * El rol es obligatorio porque los permisos dependen de él.
   */
  obtenerRegistros(catalogoId: string, rol: RolUsuario): Observable<CatalogoData> {
    const data = this.mockPorCatalogo(catalogoId, rol);
    return of(data).pipe(delay(200));
  }

  // ── Resolución de permisos ────────────────────────────────────
  private permisosPara(rol: RolUsuario, catalogoId: string): PermisosCatalogo {
    return this.permisosPorRol[rol]?.[catalogoId] ?? {
      puedeAgregar: false,
      puedeEliminar: false,
      columnasNoEditables: [] // vacío = nada editable solo si además no hay filas; ver nota
    };
  }

  // ── Mock de datos (compartido entre roles) ────────────────────
  private mockPorCatalogo(id: string, rol: RolUsuario): CatalogoData {
    const permisos = this.permisosPara(rol, id);

    switch (id) {
      case 'proveedores':
        return {
          columnas: [
            { nombre: 'Id',          tipo: 'Int32'  },
            { nombre: 'RazonSocial', tipo: 'String' },
            { nombre: 'RFC',         tipo: 'String' },
            { nombre: 'Activo',      tipo: 'Int32'  }
          ],
          filas: this.filasProveedores(),
          permisos
        };

      case 'empleados':
        return {
          columnas: [
            { nombre: 'Id',     tipo: 'Int32'  },
            { nombre: 'Nombre', tipo: 'String' },
            { nombre: 'Puesto', tipo: 'String' },
            { nombre: 'Activo', tipo: 'Int32'  }
          ],
          filas: this.filasEmpleados(),
          permisos
        };

      case 'unidades':
        return {
          columnas: [
            { nombre: 'Id',     tipo: 'Int32'  },
            { nombre: 'Placa',  tipo: 'String' },
            { nombre: 'Modelo', tipo: 'String' },
            { nombre: 'Activo', tipo: 'Int32'  }
          ],
          filas: this.filasUnidades(),
          permisos
        };

      default:
        return {
          columnas: [], filas: [],
          permisos: { puedeAgregar: false, puedeEliminar: false, columnasNoEditables: [] }
        };
    }
  }

  private filasProveedores(): FilaCatalogo[] {
    return [
      { Id: 1, RazonSocial: 'ACME S.A. de C.V.', RFC: 'ACM010101AAA', Activo: 1 },
      { Id: 2, RazonSocial: 'Globex Corporation', RFC: 'GLO020202BBB', Activo: 1 },
      { Id: 3, RazonSocial: 'Initech S.A.',       RFC: 'INI030303CCC', Activo: 0 },
      { Id: 4, RazonSocial: 'Umbrella Corp.',     RFC: 'UMB040404DDD', Activo: 1 }
    ];
  }

  private filasEmpleados(): FilaCatalogo[] {
    return [
      { Id: 1, Nombre: 'JORGE GUTIERREZ',  Puesto: 'Sistemas',   Activo: 1 },
      { Id: 2, Nombre: 'BLANCA ORTIZ',     Puesto: 'Calidad',    Activo: 1 },
      { Id: 3, Nombre: 'EVANGELINA PEREZ', Puesto: 'Recepción',  Activo: 1 }
    ];
  }

  private filasUnidades(): FilaCatalogo[] {
    return [
      { Id: 1, Placa: 'ABC-123-A', Modelo: 'Kenworth T680', Activo: 1 },
      { Id: 2, Placa: 'XYZ-987-B', Modelo: 'Freightliner',  Activo: 1 }
    ];
  }
}