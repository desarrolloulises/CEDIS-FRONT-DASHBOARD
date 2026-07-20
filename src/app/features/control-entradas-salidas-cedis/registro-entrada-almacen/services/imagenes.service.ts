// src/app/services/imagenes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { url } from '../../../../variables';

export interface ImagenResponse {
  id: number;
  carpeta: string;
  nombreArchivo: string;
  pathRelativo: string;
}

export interface ImagenDeleteResponse {
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class ImagenesService {
  private readonly base = `${url}/cedis`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los metadatos de una imagen por ID
   */
  obtenerImagen(id: number): Observable<ImagenResponse> {
    return this.http.get<ImagenResponse>(
      `${this.base}/obtener-imagen/${id}`
    );
  }

  /**
   * Obtiene la imagen como blob para visualización
   */
  obtenerImagenArchivo(id: number): Observable<Blob> {
    return this.http.get(
      `${this.base}/imagen/${id}`,
      { responseType: 'blob' }
    );
  }

  /**
   * Sube una nueva imagen
   */
  subirImagen(archivo: File): Observable<ImagenResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    
    return this.http.post<ImagenResponse>(
      `${this.base}/subir-imagen`,
      formData
    );
  }

  /**
   * Actualiza una imagen existente
   */
  actualizarImagen(id: number, archivo: File): Observable<ImagenResponse> {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('archivo', archivo, archivo.name);
    
    return this.http.put<ImagenResponse>(
      `${this.base}/imagen`,
      formData
    );
  }

  /**
   * Elimina una imagen por ID
   */
  eliminarImagen(id: number): Observable<ImagenDeleteResponse> {
    return this.http.delete<ImagenDeleteResponse>(
      `${this.base}/imagen/${id}`
    );
  }
}