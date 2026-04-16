import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamaraQrComponent } from './camara-qr.component';

describe('CamaraQrComponent', () => {
  let component: CamaraQrComponent;
  let fixture: ComponentFixture<CamaraQrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamaraQrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamaraQrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
