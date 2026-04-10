import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UbicacionProvedoresComponent } from './ubicacion-provedores.component';

describe('UbicacionProvedoresComponent', () => {
  let component: UbicacionProvedoresComponent;
  let fixture: ComponentFixture<UbicacionProvedoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UbicacionProvedoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UbicacionProvedoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
