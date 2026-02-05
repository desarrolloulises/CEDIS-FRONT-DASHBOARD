import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, filter, Observable, pairwise } from 'rxjs';
import { APIURL_AVANCEREC, APIURL_CALIDAD, APIURL_CIERREOC, APIRUL_G3TB4I4, APIURL_GETPRIMERCONTEOFOLIO, APIURL_GETPRIMERCONTEOSCANER, APIURL_GETSEGUNDOCONTEOFOLIO, APIURL_GETSEGUNDOCONTEOSCANER, APIURL_RECIBO, APIURL_VALPRECIO, APIRUL_PR1M3R5C4N30, APIRUL_PR1M3R5C4N30F4L74N735, APIRUL_53GUMD05C4N30, APIRUL_53GUMD05C4N30F4L74N735, APIRUL_BU5C4RC4J45B4H145MARA1, APIRUL_C0N5ULT4G3N3R4LB5H145MARA2, APIRUL_C0N5ULT4D3T4113B4145MARA3, APIURL_5CTU5LIZ5RD5T5, APIURL_REPORTEGENERALINCIDENCIAS, APIURL_PRIMERCONTEOVSSEGUNDOCONTEO, APIURL_L0G1N, APIURL_4LM4C3N,APIURL_MULTITIENDA, APIURL_EXTRAERCAJAPALLET, APIURL_DESARMARPALLET, APIURL_MOVERPALLET, APIURL_CONSULTAPALLET, APIURL_CAMBIOPASSWORD } from '../variables';
import { Iembarqes } from '../interfaces/iembarqes';
import { IActualizarData, IAlmacen, IAlmacenPallet, Ibahia, IConsultaCaja, IContrasenna, IReporteGeneralIncidencias } from '../interfaces/ibahia';
import { NavigationEnd, Router } from '@angular/router';
import { IAutoidentifica } from '../interfaces/ilogin';
export interface MiData {
  info1: string;
  info2: string;
  info3: string;
  info4: string;
  info5: string;
  info6: string;
  info7: string;
  info8: string;
  info9: string;
}
@Injectable({
  providedIn: 'root'

})
export class ProcesosCedisService {
  private perfil: string = '';
  private apiUrlCalidad = APIURL_CALIDAD;
  private apiUrlRecibo = APIURL_RECIBO;
  private apiUrlCierreOC = APIURL_CIERREOC;
  private apiUrlAvanceRecibo = APIURL_AVANCEREC;
  private apiUrlValidacionPrec = APIURL_VALPRECIO;
  private apiUrlGetPrimerConteofolio = APIURL_GETPRIMERCONTEOFOLIO;
  private apiUrlGetPrimerConteoScaner = APIURL_GETPRIMERCONTEOSCANER;
  private apiUrlGetSegundoConteofolio = APIURL_GETSEGUNDOCONTEOFOLIO;
  private apiUrlGetSegundoConteoScaner = APIURL_GETSEGUNDOCONTEOSCANER;
  private apiUrlG3TB4I4 = APIRUL_G3TB4I4;
  private apiUrlBU5C4RC4J45B4H145MARA1 = APIRUL_BU5C4RC4J45B4H145MARA1;
  private apiUrl5CTU5LIZ5RD5T5 = APIURL_5CTU5LIZ5RD5T5;
  private apiUrlC0N5ULT4G3N3R4LB5H145MARA2 = APIRUL_C0N5ULT4G3N3R4LB5H145MARA2;
  private apiUrlC0N5ULT4D3T4113B4145MARA3 = APIRUL_C0N5ULT4D3T4113B4145MARA3;
  private apiUrlPR1M3R5C4N30 = APIRUL_PR1M3R5C4N30;
  private apiUrlPR1M3R5C4N30F4L74N735 = APIRUL_PR1M3R5C4N30F4L74N735;
  private apiUrl53GUMD05C4N30 = APIRUL_53GUMD05C4N30;
  private apiUrl53GUMD05C4N30F4L74N735 = APIRUL_53GUMD05C4N30F4L74N735;
  private apiUrlREPORTEGENERALINCIDENCIAS = APIURL_REPORTEGENERALINCIDENCIAS
  private apiUrlPRIMERCONTEOVSSEGUNDOCONTEO = APIURL_PRIMERCONTEOVSSEGUNDOCONTEO
  private datosPrimerEscaneo: any = null;

  private apiUrlGetL0G1N = APIURL_L0G1N;
  private apiUrlGetAlmacen = APIURL_4LM4C3N;  
  private apiUrlGetMultiTienda = APIURL_MULTITIENDA;  
  private apiUrlGetExtraeCajaPallet = APIURL_EXTRAERCAJAPALLET;
  private apiUrlGetDesarmarPallet = APIURL_DESARMARPALLET;
  private apiUrlGetMoverPallet = APIURL_MOVERPALLET;
  private apiUrlGetConsultaPallet = APIURL_CONSULTAPALLET;
  private apiUrlGetCambioPassword = APIURL_CAMBIOPASSWORD;
  
  
  

  private previousUrl: string = '';
  private currentUrl: string = '';

  constructor(private http: HttpClient, private router: Router) {
    this.currentUrl = this.router.url;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      pairwise()
    ).subscribe(([prev, curr]: [NavigationEnd, NavigationEnd]) => {
      this.previousUrl = prev.urlAfterRedirects;
      this.currentUrl = curr.urlAfterRedirects;
    });
  }
  public getPreviousUrl(): string {
    return this.previousUrl;
  }

  public getCurrentUrl(): string {
    return this.currentUrl;
  }

  guardarDatosPrimerEscaneo(data: any): void {
    this.datosPrimerEscaneo = data;
  }

  obtenerDatosPrimerEscaneo(): any {
    return this.datosPrimerEscaneo;
  }

  CedisCalidad(codigo_escaner: string): Observable<any> {
    const url = `${this.apiUrlCalidad}?codigo_escaner=${codigo_escaner}`;
    return this.http.get<any>(url);
  }
  // --------------------------------------------------------------------------------------
  CedisRecibo(codigo_escaner: string): Observable<any> {
    const url = `${this.apiUrlRecibo}?codigo_escaner=${codigo_escaner}`;
    return this.http.get<any>(url);
  }
  // --------------------------------------------------------------------------------------
  CedisCierre(codigo_escaner: string): Observable<any> {
    const url = `${this.apiUrlCierreOC}?codigo_escaner=${codigo_escaner}`;
    return this.http.get<any>(url);
  }
  // --------------------------------------------------------------------------------------
  CedisAvanceRec(codigo_escaner: string): Observable<any> {
    const url = `${this.apiUrlAvanceRecibo}?codigo_escaner=${codigo_escaner}`;
    return this.http.get<any>(url);
  }
  // --------------------------------------------------------------------------------------
  CedisValPrecio(codigo_escaner: number): Observable<any> {
    const url = `${this.apiUrlValidacionPrec}?codigo_escaneo=${codigo_escaner}`;
    return this.http.get<any>(url);
  }

  getPrimerConteoFolio(body: Iembarqes): Observable<any> {
    const url = `${this.apiUrlGetPrimerConteofolio}?proceso=${body.proceso}&folio_embarque=${body.folio_embarque}`;
    return this.http.get<any>(url);
  }

  getPrimerConteoScaner(body: Iembarqes): Observable<any> {
    const url = `${this.apiUrlGetPrimerConteoScaner}?proceso=${body.proceso}&folio_embarque=${body.folio_embarque}
    &id_tienda=${body.id_tienda}&etiqueta_caja=${body.etiqueta_caja}`;

    return this.http.get<any>(url);
  }

  getSegundoConteoFolio(body: Iembarqes): Observable<any> {
    const url = `${this.apiUrlGetSegundoConteofolio}?proceso=${body.proceso}&folio_embarque=${body.folio_embarque}`;
    return this.http.get<any>(url);
  }

  getSegundoConteoScaner(body: Iembarqes): Observable<any> {
    const url = `${this.apiUrlGetSegundoConteoScaner}?proceso=${body.proceso}&folio_embarque=${body.folio_embarque}
    &id_tienda=${body.id_tienda}&etiqueta_caja=${body.etiqueta_caja}`;
    return this.http.get<any>(url);
  }

  getBahia(body: Ibahia): Observable<any> {
    // const url = `${this.apiUrlG3TB4I4}?proceso=${body.proceso}&bahia=${body.bahia}`;
    const url = `${this.apiUrlG3TB4I4}?proceso=${body.proceso}&bahia=${body.bahia}&etiqueta_caja=${body.etiqueta_caja}`;
    return this.http.get<any>(url);
  }

  setPerfil(value: any) {
    this.perfil = value;
  }

  getPerfil(): string {
    return this.perfil;
  }

  clearPerfil() {
    this.perfil = '';
  }

  primerEscaneo(escaneo_caja: string) {
    const url = `${this.apiUrlPR1M3R5C4N30}?escaneo_caja=${escaneo_caja}`;
    return this.http.get<any>(url);
  }

  primerFaltante(orden: string) {
    const url = `${this.apiUrlPR1M3R5C4N30F4L74N735}?orden=${orden}`;
    return this.http.get<any>(url);
  }

  segundoEscaneo(escaneo_caja: string) {
    const url = `${this.apiUrl53GUMD05C4N30}?escaneo_caja=${escaneo_caja}`;
    return this.http.get<any>(url);
  }

  segundoFaltante(orden: string) {
    const url = `${this.apiUrl53GUMD05C4N30F4L74N735}?orden=${orden}`;
    return this.http.get<any>(url);
  }


  getConsultaCaja(body: IConsultaCaja): Observable<HttpResponse<any>> {
    const url = `${this.apiUrlBU5C4RC4J45B4H145MARA1}?orden=${body.orden}&tienda=${body.tienda}`;

    return this.http.get<any>(url, { observe: 'response' });
  }

  getConsultaGeneralDeBahias(): Observable<any> {
    const url = `${this.apiUrlC0N5ULT4G3N3R4LB5H145MARA2}`;
    return this.http.get<any>(url);
  }

  getConsultaDetalleDeBahias(body: any): Observable<any> {
    const url = `${this.apiUrlC0N5ULT4D3T4113B4145MARA3}?bahia=${body.orden}&tienda=${body.tienda}`;
    return this.http.get<any>(url);
  }

  getActualizarData(body: IActualizarData): Observable<HttpResponse<any>> {
    // const url = `${this.apiUrl5CTU5LIZ5RD5T5}?proceso=${body.proceso}&folio_embarque=${body.folio_embarque}`;
    const url = `${this.apiUrlGetSegundoConteofolio}?proceso=${body.proceso}&folio_embarque=${body.folio_embarque}`;
    const res = this.http.get<any>(url, { observe: 'response' });
    return res;

  }

  getReporteGeneralIncidencias(body: IReporteGeneralIncidencias) {
    let params = new HttpParams().set('manifiesto', body.manifiesto);
    if (body.tienda) params = params.set('tienda', body.tienda);
    if (body.caja) params = params.set('caja', body.caja);
    return this.http.get<any>(this.apiUrlREPORTEGENERALINCIDENCIAS, { params });
  }

  GetPrimerConteoVSSegundoConteo(body: IReporteGeneralIncidencias) {
    let params = new HttpParams().set('manifiesto', body.manifiesto);
    if (body.tienda) params = params.set('tienda', body.tienda);
    if (body.caja) params = params.set('caja', body.caja);
    return this.http.get<any>(this.apiUrlPRIMERCONTEOVSSEGUNDOCONTEO, { params });
  }

  //--------------------------------------------------------------------------------------
  getLogin(body: IAutoidentifica): Observable<any> {
    let params = new HttpParams().set('proceso', body.proceso);
    if (body.usuario) params = params.set('usuario', body.usuario);
    if (body.password) params = params.set('password', body.password);
    return this.http.get<any>(this.apiUrlGetL0G1N, { params });
    /* const url = `${this.apiUrlGetL0G1N}?tipo=${body.tipo}&Usuario=${body.Usuario}&Password=${body.Password}`;   
     return this.http.get<any>(url, { observe: 'response' });*/
  }

  //--------------------------------------------------------------------------------------
  getAlmacen(body: IAlmacen): Observable<any> {
    let params = new HttpParams().set('tipo', body.tipo);
    if (body.Id_Pallet) params = params.set('Id_Pallet', body.Id_Pallet);
    if (body.Inp_txt8) params = params.set('Inp_txt8', body.Inp_txt8);    
    if (body.Usuario) params = params.set('Usuario', body.Usuario); 
    return this.http.get<any>(this.apiUrlGetAlmacen, { params });
  }

   //--------------------------------------------------------------------------------------
  getMultitienda(body: IAlmacen): Observable<any> {
    let params = new HttpParams().set('tipo', body.tipo);
    if (body.Id_Pallet) params = params.set('Id_Pallet', body.Id_Pallet);
    if (body.Inp_txt8) params = params.set('Inp_txt8', body.Inp_txt8);  
    if (body.Usuario) params = params.set('Usuario', body.Usuario);  
    return this.http.get<any>(this.apiUrlGetMultiTienda, { params });
  }

   //--------------------------------------------------------------------------------------
  getMoverCajaPallet(body: IAlmacen): Observable<any> {
    let params = new HttpParams().set('tipo', body.tipo);
    if (body.Id_Pallet) params = params.set('Id_Pallet', body.Id_Pallet);
    if (body.Inp_txt8) params = params.set('Inp_txt8', body.Inp_txt8);  
    if (body.Usuario) params = params.set('Usuario', body.Usuario);  
    return this.http.get<any>(this.apiUrlGetMultiTienda, { params });
  }

   //--------------------------------------------------------------------------------------
  getExtraeCajaPallet(body: IAlmacen): Observable<any> {
    let params = new HttpParams().set('tipo', body.tipo);
    if (body.Id_Pallet) params = params.set('Id_Pallet', body.Id_Pallet);
    if (body.Inp_txt8) params = params.set('Inp_txt8', body.Inp_txt8);  
    if (body.Usuario) params = params.set('Usuario', body.Usuario);  
    return this.http.get<any>(this.apiUrlGetExtraeCajaPallet, { params });
  }

   //--------------------------------------------------------------------------------------
  getDesarmarPallet(body: IAlmacenPallet): Observable<any> {
    let params = new HttpParams().set('tipo', body.tipo);
    if (body.Inp_txt8) params = params.set('Inp_txt8', body.Inp_txt8);  
    if (body.Usuario) params = params.set('Usuario', body.Usuario);  
    return this.http.get<any>(this.apiUrlGetDesarmarPallet, { params });
  }

   //--------------------------------------------------------------------------------------
  getMoverPalletUbicacion(body: IAlmacen): Observable<any> {
    let params = new HttpParams().set('tipo', body.tipo);
    if (body.Id_Pallet) params = params.set('Id_Pallet', body.Id_Pallet);
    if (body.Inp_txt8) params = params.set('Inp_txt8', body.Inp_txt8);  
    if (body.Usuario) params = params.set('Usuario', body.Usuario);  
    return this.http.get<any>(this.apiUrlGetMoverPallet, { params });
  }

   //--------------------------------------------------------------------------------------
  getConsultarPallet(body: IAlmacenPallet): Observable<any> {
    let params = new HttpParams().set('tipo', body.tipo);
    if (body.Inp_txt8) params = params.set('Inp_txt8', body.Inp_txt8);  
    if (body.Usuario) params = params.set('Usuario', body.Usuario);  
    return this.http.get<any>(this.apiUrlGetConsultaPallet, { params });
  }

   //--------------------------------------------------------------------------------------
  getCambioContrasena(body: IContrasenna): Observable<any> {
    let params = new HttpParams().set('Usuario', body.Usuario);
    if (body.Password) params = params.set('Password', body.Password);  
    if (body.PasswordN1) params = params.set('PasswordN1', body.PasswordN1);  
    if (body.PasswordN2) params = params.set('PasswordN2', body.PasswordN2);  
    return this.http.get<any>(this.apiUrlGetCambioPassword, { params });
  }









  
  
/******** PASAMOS PALLET***** */

// Creamos la señal para el folio. Inicializa en null o cadena vacía.
  public palletEnviado = signal<string>('');

 


  ///---------------------------------
  //envia

  // Definimos un BehaviorSubject con un valor inicial (puede ser null o un objeto vacío)
  private dataSource = new BehaviorSubject<any>(null);
  // Este observable es el que escucharán los componentes
  data$ = this.dataSource.asObservable();

  // Método para actualizar los datos
  enviarDatos(datos: any) {
    this.dataSource.next(datos);
  }


  //**********  Enviar mediante signal *************/
  // Definimos la signal con un valor inicial (puede ser null o un objeto)
  private dataSignal = signal<string>('Valor inicial');

  // Exponemos la signal como de solo lectura para proteger el estado
  public data = this.dataSignal.asReadonly();

  // Método para actualizar el valor desde cualquier componente
  updateData(newValue: string) {
    this.dataSignal.set(newValue);
  }
}
