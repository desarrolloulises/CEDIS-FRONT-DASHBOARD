import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntradaSalidaTransportistaCasetaComponent } from './entrada-salida-transportista-caseta.component';

describe('EntradaSalidaTransportistaCasetaComponent', () => {
  let component: EntradaSalidaTransportistaCasetaComponent;
  let fixture: ComponentFixture<EntradaSalidaTransportistaCasetaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntradaSalidaTransportistaCasetaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntradaSalidaTransportistaCasetaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
