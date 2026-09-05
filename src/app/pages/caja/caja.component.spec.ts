import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CajaComponent } from './caja.component';

describe('CajaComponent', () => {
  let component: CajaComponent;
  let fixture: ComponentFixture<CajaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CajaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CajaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});