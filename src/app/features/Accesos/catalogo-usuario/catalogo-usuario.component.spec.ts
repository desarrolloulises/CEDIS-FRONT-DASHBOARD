import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoUsuarioComponent } from './catalogo-usuario.component';

describe('CatalogoUsuarioComponent', () => {
  let component: CatalogoUsuarioComponent;
  let fixture: ComponentFixture<CatalogoUsuarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoUsuarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogoUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
