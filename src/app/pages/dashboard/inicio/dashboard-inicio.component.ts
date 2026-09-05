import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmpresasComponent }
  from '../../empresas/empresas/empresas.component';

@Component({
  selector: 'app-dashboard-inicio',
  standalone: true,
  imports: [
    CommonModule,
    EmpresasComponent
  ],
  templateUrl: './dashboard-inicio.component.html',
  styleUrls: ['./dashboard-inicio.component.css']
})
export class DashboardInicioComponent {}