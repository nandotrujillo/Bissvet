import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsuarioService } from '../../Services/usuario.service';

@Component({
  selector: 'app-seguridad',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  template: `
    <div class="seguridad-container">

      <div class="encabezado">

        <div>

          <h1>🔐 Seguridad y Administración</h1>

          <p>
            Gestión de usuarios, perfiles, roles, permisos, sesiones y auditoría
          </p>

        </div>

      </div>


      <div class="grid-tarjetas">


        <!-- USUARIOS -->

        <a class="tarjeta" routerLink="/dashboard/usuarios">

          <div class="tarjeta-icono">👤</div>

          <h2>Usuarios</h2>

          <p>Crear, editar, bloquear y cambiar contraseñas de usuarios del sistema</p>

        </a>


        <!-- PERFILES -->

        <a class="tarjeta" routerLink="/dashboard/perfiles">

          <div class="tarjeta-icono">🧑‍💻</div>

          <h2>Perfiles</h2>

          <p>Definir perfiles y sus permisos iniciales (configuración por defecto)</p>

        </a>


        <!-- ROLES Y MATRIZ -->

        <a class="tarjeta" routerLink="/dashboard/roles">

          <div class="tarjeta-icono">🎭</div>

          <h2>Roles y matriz de permisos</h2>

          <p>Crear roles y asignar los permisos que otorgan o deniegan</p>

        </a>


        <!-- SESIONES -->

        <a class="tarjeta" routerLink="/dashboard/sesiones">

          <div class="tarjeta-icono">🖥️</div>

          <h2>Sesiones activas</h2>

          <p>Revisar los inicios de sesión y su estado en la empresa</p>

        </a>


        <!-- AUDITORÍA -->

        <a class="tarjeta" routerLink="/dashboard/auditoria">

          <div class="tarjeta-icono">📜</div>

          <h2>Auditoría</h2>

          <p>Consultar el registro de acciones realizadas en el sistema</p>

        </a>

      </div>

    </div>
  `,
  styles: [`
    .seguridad-container {
      padding: 25px;
      background: #f5f7fa;
      min-height: calc(100vh - 70px);
    }
    .encabezado h1 { margin: 0; font-size: 28px; color: #1f2937; }
    .encabezado p { margin: 5px 0 25px; color: #6b7280; }
    .grid-tarjetas {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 18px;
    }
    .tarjeta {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
      text-decoration: none;
      color: #1f2937;
      transition: transform .15s ease, box-shadow .15s ease;
      border-left: 4px solid #2563eb;
    }
    .tarjeta:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 18px rgba(0,0,0,.12);
    }
    .tarjeta-icono { font-size: 32px; margin-bottom: 12px; }
    .tarjeta h2 { margin: 0 0 8px; font-size: 18px; color: #1f2937; }
    .tarjeta p { margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5; }
  `]
})
export class SeguridadComponent implements OnInit {

  sesionActual: string = '';

  constructor(private usuarioService: UsuarioService) { }

  ngOnInit(): void { }
}