import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { DatosService } from '../../../../service/servicio.service';
import {
  DimensionesCuadriculaResponse,
  EspaciosAsignadosResponse,
  CoordenadasRequest,
  AsignarEspacioRequest,
  LiberarEspacioRequest,
  ApiResponse,
  PermisoResponse,
  ProveedorAPI,
  ProveedorLocal,
  Dimensiones
} from '../models/ubicacion-proveedores.models';

@Injectable({
  providedIn: 'root'
})
export class UbicacionProveedoresService {
  private http = inject(HttpClient);
  private datosService = inject(DatosService);

  private readonly API_URL = 'http://localhost:5242/cedis/espacios-asignados';
  private readonly PERMISOS_URL = 'http://192.168.101.10/cedis/PERFIL';

  // --- OBTENER DIMENSIONES ---

  async obtenerDimensiones(): Promise<Dimensiones> {
    try {
      const response = await lastValueFrom(
        this.http.get<DimensionesCuadriculaResponse>(
          `${this.API_URL}/obtener-dimenciones-cuadricula`
        )
      );

      if (!response || response.error !== '0') {
        throw new Error(response?.DesError || 'Error al obtener dimensiones');
      }

      return {
        filas: parseInt(response.Renglon) || 12,
        columnas: parseInt(response.Columna) || 29
      };
    } catch (error) {
      console.error('Error al obtener dimensiones:', error);
      // Valores por defecto en caso de error
      return { filas: 12, columnas: 29 };
    }
  }

  // --- OBTENER ESPACIOS ASIGNADOS ---

  async obtenerEspaciosAsignados(): Promise<EspaciosAsignadosResponse> {
    try {
      const response = await lastValueFrom(
        this.http.get<EspaciosAsignadosResponse>(this.API_URL)
      );

      if (!response || response.error !== '0') {
        throw new Error(response?.DesError || 'Error al obtener espacios asignados');
      }

      return response;
    } catch (error) {
      console.error('Error al obtener espacios asignados:', error);
      throw error;
    }
  }

  // --- VERIFICAR PERMISOS ---

  async verificarPermisos(): Promise<boolean> {
    try {
      const usuario = this.datosService.usuarioSignal();
      
      if (!usuario) {
        console.warn('No hay usuario definido, permisos denegados por defecto');
        return false;
      }

      const response = await lastValueFrom(
        this.http.get<PermisoResponse[]>(
          `${this.PERMISOS_URL}?Usuario=${usuario}&Nivel=3&SubNivel=14&SubAcceso=1`
        )
      );

      // Si hay respuesta, tiene permisos de bloqueo
      return response && response.length > 0 && response[0].Opcion === 1;
    } catch (error: any) {
      // Si es 404, no tiene permisos de bloqueo
      if (error?.status === 404) {
        return false;
      }
      console.error('Error al verificar permisos:', error);
      return false;
    }
  }

  // --- OPERACIONES DE BLOQUEO ---

  async bloquearCeldas(coordenadas: string[]): Promise<ApiResponse> {
    try {
      const request: CoordenadasRequest = { coordenadas };
      const response = await lastValueFrom(
        this.http.post<ApiResponse>(
          `${this.API_URL}/agregar-bloqueo`,
          request
        )
      );

      if (!response || response.error !== '0') {
        throw new Error(response?.DesError || 'No se pudieron bloquear las celdas');
      }

      return response;
    } catch (error) {
      console.error('Error al bloquear celdas:', error);
      throw error;
    }
  }

  async liberarBloqueoCeldas(coordenadas: string[]): Promise<ApiResponse> {
    try {
      const request: CoordenadasRequest = { coordenadas };
      const response = await lastValueFrom(
        this.http.post<ApiResponse>(
          `${this.API_URL}/liberar-bloqueo`,
          request
        )
      );

      if (!response || response.error !== '0') {
        throw new Error(response?.DesError || 'No se pudieron desbloquear las celdas');
      }

      return response;
    } catch (error) {
      console.error('Error al desbloquear celdas:', error);
      throw error;
    }
  }

  // --- OPERACIONES DE PROVEEDORES ---

  async asignarEspacioProveedor(
    proveedor: string, 
    coordenadas: string[]
  ): Promise<ApiResponse> {
    try {
      const request: AsignarEspacioRequest = {
        proveedor,
        coordenadas
      };
      
      const response = await lastValueFrom(
        this.http.post<ApiResponse>(
          `${this.API_URL}/asignar-espacio-proveedor`,
          request
        )
      );

      if (!response || response.error !== '0') {
        throw new Error(response?.DesError || 'No se pudo asignar el espacio');
      }

      return response;
    } catch (error) {
      console.error('Error al asignar espacio:', error);
      throw error;
    }
  }

  async liberarEspaciosProveedor(
    proveedor: string, 
    coordenadas: string[]
  ): Promise<ApiResponse> {
    try {
      const request: LiberarEspacioRequest = {
        proveedor,
        coordenadas
      };
      
      const response = await lastValueFrom(
        this.http.post<ApiResponse>(
          `${this.API_URL}/liberar-espacio-proveedor`,
          request
        )
      );

      if (!response || response.error !== '0') {
        throw new Error(response?.DesError || 'No se pudo liberar el espacio');
      }

      return response;
    } catch (error) {
      console.error('Error al liberar espacio:', error);
      throw error;
    }
  }

  // --- UTILIDADES ---

  procesarProveedores(
    proveedoresApi: ProveedorAPI[]
  ): {
    proveedores: ProveedorLocal[];
    mapaProveedores: Map<string, Set<string>>;
  } {
    const proveedores: ProveedorLocal[] = [];
    const mapaProveedores = new Map<string, Set<string>>();

    proveedoresApi.forEach(prov => {
      proveedores.push({ id: prov.provedor, color: prov.color });
      mapaProveedores.set(prov.provedor, new Set(prov.celdas));
    });

    return { proveedores, mapaProveedores };
  }

  convertirAProveedoresAPI(
    proveedores: ProveedorLocal[],
    mapaProveedores: Map<string, Set<string>>
  ): ProveedorAPI[] {
    return proveedores.map(prov => ({
      provedor: prov.id,
      color: prov.color,
      celdas: Array.from(mapaProveedores.get(prov.id) || [])
    }));
  }
}