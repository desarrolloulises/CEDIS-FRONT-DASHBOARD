import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoPerfilesComponent } from './catalogo-perfiles.component';

describe('CatalogoPerfilesComponent', () => {
  let component: CatalogoPerfilesComponent;
  let fixture: ComponentFixture<CatalogoPerfilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoPerfilesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogoPerfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
