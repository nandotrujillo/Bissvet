import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmpresasComponent }
  from '../../empresas/empresas/empresas.component';

import { DashboardService }
  from '../../../Services/dashboard.service';

@Component({
  selector: 'app-dashboard-inicio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EmpresasComponent
  ],
  templateUrl: './dashboard-inicio.component.html',
  styleUrls: ['./dashboard-inicio.component.css']
})
export class DashboardInicioComponent implements OnInit {

  kpis: any = null;
  cargando = false;
  error = '';

  constructor(
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.cargando = true;
    this.error = '';
    this.dashboardService.resumen().subscribe({
      next: (respuesta: any) => {
        this.kpis = respuesta.datos || null;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error cargando resumen:', err);
        this.error = 'No fue posible cargar el resumen del dashboard.';
        this.cargando = false;
      }
    });
  }

  formatoMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor || 0);
  }
}