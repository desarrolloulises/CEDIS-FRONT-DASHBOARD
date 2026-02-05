import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  // Simulamos lo que viene de tu base de datos
  // Un usuario "Operador" solo tendría ALM_INV con READ.
  private permisosActuales: any = {
    "ALM_INV": ["READ", "SUB_A", "SUB_B"], 
    "ALM_REC": ["READ"],
    "USER_MENU": ["CHANGE_PASS"]
  };

  constructor() {}

  // ¿Puede ver el módulo principal (ej: Inventario)?
  tieneAccesoModulo(modulo: string): boolean {
    return !!this.permisosActuales[modulo];
  }

  // ¿Puede ver una subopción o botón específico?
  tienePermiso(modulo: string, accion: string): boolean {
    return this.permisosActuales[modulo]?.includes(accion) || false;
  }
}