import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ProcesosCedisService } from '../../service/procesos-cedis.service';
import { DatosService } from '../../service/servicio.service';

@Component({
  selector: 'app-cambio-pass',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './cambio-pass.component.html',
  styleUrl: './cambio-pass.component.css'
})
export class CambioPassComponent {
  // 1. Definimos las señales de visibilidad
  // 1. Declaramos la variable que falta para los errores
  errorMsg: string | null = null;
  verOld = signal(false);
  verNew = signal(false);
  verConfirm = signal(false);
  cargando = signal(false);

  passwordForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private service: ProcesosCedisService,
    public datosService: DatosService,) {

    this.passwordForm = this.fb.group({
      user: ['', Validators.required],
      passOld: ['', Validators.required],
      passN1: ['', [Validators.required,]], //Validators.minLength(8)
      passN2: ['', Validators.required]
    });
  }
  /***************************************************************** */

  //*******************Para obterne datos de contarsena*************** */
  //datos de formulario para treaer los datos de las cajas


  //metodo para cambiar el password  
  actualizarPassword() {
    const user: string = this.passwordForm.get('user')?.value
    const passOld: string = this.passwordForm.get('passOld')?.value
    const passN1: string = this.passwordForm.get('passN1')?.value 
    const passN2: string =  this.passwordForm.get('passN2')?.value 
    console.log("valores ", user,passOld,passN1,passN2);
    
    if (user === "" || passOld === "" || passN1 === "" || passN2 === "") {
      return
    }
    const body = {
      Usuario: user,
      Password: passOld,
      PasswordN1: passN1,
      PasswordN2: passN2,
    }
    console.log(body);

    this.service.getCambioContrasena(body).subscribe((response) => {
      if (response[0].err_id == "") {
        // console.log("user");     
        this.errorMsg = response[0].err_msg
        this.passwordForm.reset();
        alert("Contraseña cambiada con exito")
      }
      else {
        this.errorMsg = response[0].err_msg
        //  this.errorMsg = this.response[0].err_id       
        //this.playBeep();
      }
    });

  }

  /**************************************************************** */
  // 2. Métodos independientes para conmutar la visibilidad
  toggleOld() {
    this.verOld.update(val => !val);
  }

  toggleNew() {
    this.verNew.update(val => !val);
  }

  toggleConfirm() {
    this.verConfirm.update(val => !val);
  }


}


