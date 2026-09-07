// captura-curp.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CurpInputComponent } from "../../../../../shared/curp-input/curp-input.component";

@Component({
    selector: 'app-captura-curp',
    standalone: true,
    imports: [CommonModule, ButtonComponent, CurpInputComponent],
    templateUrl: './captura-curp.component.html',
    styleUrls: ['./captura-curp.component.css']
})
export class CapturaCurpComponent {
    @Input() curp: string = '';
    @Input() curpValidadoFlag: boolean = false;

    @Output() curpChange = new EventEmitter<string>();
    @Output() curpValidar = new EventEmitter<void>();

    get curpCompleto(): boolean {
        return !!this.curp && this.curp.length === 18;
    }

    onCurpChange(valor: string): void {
        this.curp = valor.toUpperCase();
        this.curpChange.emit(this.curp);
    }

    validarCurp(): void {
        this.curpValidar.emit();
    }
}