import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroTransportistaComponent } from './registro-transportista.component';

describe('RegistroTransportistaComponent', () => {
  let component: RegistroTransportistaComponent;
  let fixture: ComponentFixture<RegistroTransportistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroTransportistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroTransportistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
