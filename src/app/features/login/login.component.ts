import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProcesosCedisService } from '../../service/procesos-cedis.service';
import { DatosService } from '../../service/servicio.service';
import { PermissionService } from '../../core/permission.service';//importamos el servicio
export interface IAutoidentifica {
  proceso: number,
  usuario: string;
  password: string;
}
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  constructor(private service: ProcesosCedisService, private datosService: DatosService,  private router: Router) { }

  //Inyectar el servicio
  private authService = inject(PermissionService);


  private permissionService = inject(PermissionService);

  private fb = inject(FormBuilder);

  errorMsg: string | null = null;

  // Estructura del formulario
  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  verPassword = signal(false); // para ojo de campo password



  /******************METODOS******************** */

  validarUsuario() {
    localStorage.setItem('userToken', '...');
    //asigna
    const body = {
      proceso: 1,
      usuario: this.loginForm?.value.username ?? '',
      password: this.loginForm?.value.password ?? ''
    }
    const body2 = {
      proceso: 2,
      usuario: this.loginForm.value.username ?? '',
      password: this.loginForm.value.password ?? ''
    }
    // PASO A: Obligamos al navegador a cerrar el teclado antes de cualquier otra cosa
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      this.ValidaUser(body, body2);
    }, 100);
  }

  //valida user
  ValidaUser(body: IAutoidentifica, body2: IAutoidentifica) {

    this.service.getLogin(body).subscribe((response) => {

      if (response[0].err_id == "") {
        this.Validapass(body2)
      }
      else {
        this.errorMsg = response[0].err_msg
      }
    });
  }
  //valida pass
  Validapass(body: IAutoidentifica) {

    this.service.getLogin(body).subscribe({
      next: (response) => {
        //console.log( response[0].err_id );    
        if (response && response.length > 0 && !response[0].err_id) {
          //console.log("Acceso concedido");
          // Cuando el login es correcto:
          sessionStorage.setItem('userToken', 'SESION_VALIDA');

          // Tienes que usar el alias que le diste al servicio (probablemente 'authService' o 'service')
          this.authService.isLogged.set(true);

          this.authService.iniciarVigilancia();

          this.agregarDato()
          // this.permissionService.login('TOKEN-CEDIS-2026');
          this.router.navigate(['/inicio']);

        } else {
          this.errorMsg = response[0].err_msg
        }
      }, error: (err) => {
        // ESTO PASA SI LA API ESTÁ CAÍDA O NO HAY INTERNET
        console.error("La API no responde:", err);
        alert("⚠️ Error crítico: No se pudo conectar con el servidor del CEDIS. Acceso denegado.");

        // Aseguramos que NO se guarde nada
        localStorage.removeItem('userToken');
        this.authService.isLogged.set(false);
      }
    });
  }


  agregarDato() {
    const nuevoDato = this.loginForm.value.username ?? '';
    this.datosService.actualizarUsuario(nuevoDato);
  }
  limpiar() {
    this.loginForm.reset()
    //this.errorMsg = ""
  }

  /**Para ver lo quehay en password */
  togglePassword() {
    this.verPassword.update(v => !v);
  }

}