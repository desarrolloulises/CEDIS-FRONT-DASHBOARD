import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccesoPerfilComponent } from './acceso-perfil.component';

describe('AccesoPerfilComponent', () => {
  let component: AccesoPerfilComponent;
  let fixture: ComponentFixture<AccesoPerfilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccesoPerfilComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccesoPerfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
