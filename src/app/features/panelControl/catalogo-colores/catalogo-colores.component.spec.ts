import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoColoresComponent } from './catalogo-colores.component';

describe('CatalogoColoresComponent', () => {
  let component: CatalogoColoresComponent;
  let fixture: ComponentFixture<CatalogoColoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoColoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogoColoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
