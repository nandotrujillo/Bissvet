import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-enconstruccion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="enconstruccion">
      <div class="icono">🚧</div>
      <h2>{{ titulo }}</h2>
      <p>Módulo en construcción. Los permisos ya están validados en el backend; la pantalla de administración se implementará próximamente.</p>
    </div>
  `,
  styles: [`
    .enconstruccion {
      background: #fff;
      border-radius: 12px;
      padding: 48px 32px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    }
    .icono { font-size: 48px; }
    h2 { color: #123d32; margin: 16px 0 8px; }
    p { color: #6b7b76; max-width: 480px; margin: 0 auto; }
  `]
})
export class EnConstruccionComponent implements OnInit {

  titulo: string = 'Inicio';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    const data = this.route.snapshot.data as { titulo?: string };
    if (data?.titulo) {
      this.titulo = data.titulo;
    }
  }
}