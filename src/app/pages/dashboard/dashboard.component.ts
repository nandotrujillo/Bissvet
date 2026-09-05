import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterLink,
  RouterOutlet
} from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet
  ],

  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  empresaNombre: string = '';

  ngOnInit(): void {

    if (typeof localStorage !== 'undefined') {

      const sesion = localStorage.getItem('empresa');

      if (sesion) {

        try {

          const empresa = JSON.parse(sesion);

          this.empresaNombre =
            empresa?.NombreComercial || '';

        } catch (error) {

          console.error('Error leyendo empresa de sesión:', error);
        }
      }
    }
  }

}