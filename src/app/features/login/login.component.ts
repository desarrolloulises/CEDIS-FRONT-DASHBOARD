import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProcesosCedisService } from '../../service/procesos-cedis.service';
import { DatosService } from '../../service/servicio.service';
import { PermissionService } from '../../core/permission.service';
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

  constructor(private service: ProcesosCedisService, private datosService: DatosService) { }

private permissionService = inject(PermissionService);

  private fb = inject(FormBuilder);
  private router = inject(Router);

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

    this.service.getLogin(body).subscribe((response) => {

      //console.log( response[0].err_id );    
      if (response[0].err_id == "") {
        this.agregarDato()
        this.permissionService.login('TOKEN-CEDIS-2026');
        this.router.navigate(['/inventario']);

      }
      else {
        this.errorMsg = response[0].err_msg
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