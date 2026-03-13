import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoAcessosComponent } from './catalogo-acessos.component';

describe('CatalogoAcessosComponent', () => {
  let component: CatalogoAcessosComponent;
  let fixture: ComponentFixture<CatalogoAcessosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoAcessosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogoAcessosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
