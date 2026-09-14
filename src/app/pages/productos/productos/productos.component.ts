import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Producto } from '../../../Models/producto';
import { CategoriaProducto } from '../../../Models/categoria-producto';
import { Marca } from '../../../Models/marca';
import { UnidadMedida } from '../../../Models/unidad-medida';

import { ProductosService } from '../../../Services/productos.service';
import { CategoriasProductoService } from '../../../Services/categorias-producto.service';
import { MarcasService } from '../../../Services/marcas.service';
import { UnidadesMedidaService } from '../../../Services/unidades-medida.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {

  vista: 'productos' | 'categorias' | 'marcas' | 'unidades' = 'productos';

  productos: Producto[] = [];
  categorias: CategoriaProducto[] = [];
  marcas: Marca[] = [];
  unidadesMedida: UnidadMedida[] = [];

  producto: Producto = this.nuevoProducto();
  categoria: CategoriaProducto = this.nuevaCategoria();
  marca: Marca = this.nuevaMarca();
  unidadMedida: UnidadMedida = this.nuevaUnidadMedida();

  editando = false;
  mostrarFormulario = false;

  editandoCategoria = false;
  mostrarFormularioCategoria = false;

  editandoMarca = false;
  mostrarFormularioMarca = false;

  editandoUnidadMedida = false;
  mostrarFormularioUnidadMedida = false;

  buscar = '';

  mensaje = '';
  error = '';

  constructor(
    private productosService: ProductosService,
    private categoriasService: CategoriasProductoService,
    private marcasService: MarcasService,
    private unidadesMedidaService: UnidadesMedidaService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias();
    this.cargarMarcas();
    this.cargarUnidadesMedida();
  }

  nuevoProducto(): Producto {
    return {
      CodigoProducto: '',
      CodigoBarras: '',
      NombreProducto: '',
      Descripcion: '',
      IdCategoriaProducto: 0,
      IdUnidadMedida: 0,
      IdMarca: 0,
      Referencia: '',
      PrecioVenta: 0,
      CostoActual: 0,
      CostoPromedio: 0,
      StockMinimo: 0,
      StockMaximo: 0,
      ManejaInventario: 1,
      PermiteVenta: 1,
      Activo: 1
    };
  }

  nuevaCategoria(): CategoriaProducto {
    return {
      Nombre: '',
      Descripcion: '',
      Activo: 1
    };
  }

  nuevaMarca(): Marca {
    return {
      Nombre: '',
      Descripcion: '',
      Activo: 1
    };
  }

  nuevaUnidadMedida(): UnidadMedida {
    return {
      Unidad: '',
      Descripcion: '',
      Activo: 1
    };
  }

  cambiarVista(vista: 'productos' | 'categorias' | 'marcas' | 'unidades'): void {

    this.vista = vista;

    this.mensaje = '';
    this.error = '';

    this.cancelarProducto();
    this.cancelarCategoria();
    this.cancelarMarca();
    this.cancelarUnidadMedida();
  }

  cargarProductos(): void {

    const params: any = {};
    if (this.buscar.trim()) { params.buscar = this.buscar.trim(); }

    this.productosService.listar(params).subscribe({
      next: (respuesta: any) => {
        this.productos = respuesta?.datos ?? [];
      },
      error: (error: any) => {
        console.error('Error cargando productos:', error);
        this.error = 'No fue posible cargar los productos.';
      }
    });
  }

  cargarCategorias(): void {

    this.categoriasService.listar().subscribe({
      next: (respuesta: any) => {
        this.categorias = respuesta?.datos ?? [];
      },
      error: (error: any) => {
        console.error('Error cargando categorías:', error);
        this.error = 'No fue posible cargar las categorías.';
      }
    });
  }

  cargarMarcas(): void {

    this.marcasService.listar().subscribe({
      next: (respuesta: any) => {
        this.marcas = respuesta?.datos ?? [];
      },
      error: (error: any) => {
        console.error('Error cargando marcas:', error);
        this.error = 'No fue posible cargar las marcas.';
      }
    });
  }

  cargarUnidadesMedida(): void {

    this.unidadesMedidaService.listar().subscribe({
      next: (respuesta: any) => {
        this.unidadesMedida = respuesta?.datos ?? [];
      },
      error: (error: any) => {
        console.error('Error cargando unidades de medida:', error);
        this.error = 'No fue posible cargar las unidades de medida.';
      }
    });
  }

  // ==================================================
  // PRODUCTOS
  // ==================================================

  nueva(): void {

    this.producto = this.nuevoProducto();

    this.editando = false;
    this.mostrarFormulario = true;

    this.mensaje = '';
    this.error = '';
  }

  editar(producto: Producto): void {

    this.producto = { ...producto };

    this.editando = true;
    this.mostrarFormulario = true;

    this.mensaje = '';
    this.error = '';
  }

  cancelarProducto(): void {

    this.producto = this.nuevoProducto();

    this.editando = false;
    this.mostrarFormulario = false;

    this.mensaje = '';
    this.error = '';
  }

  guardarProducto(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.producto.CodigoProducto || !this.producto.CodigoProducto.trim()) {
      this.error = 'El código del producto es obligatorio.';
      return;
    }

    if (!this.producto.NombreProducto || !this.producto.NombreProducto.trim()) {
      this.error = 'El nombre del producto es obligatorio.';
      return;
    }

    if (!this.producto.IdCategoriaProducto) {
      this.error = 'Debe seleccionar una categoría.';
      return;
    }

    if (this.editando && this.producto.IdProducto) {

      this.productosService
        .actualizar(this.producto.IdProducto, this.producto)
        .subscribe({
          next: () => {
            this.mensaje = 'Producto actualizado correctamente.';
            this.cargarProductos();
            this.mostrarFormulario = false;
            this.editando = false;
            this.producto = this.nuevoProducto();
          },
          error: (error: any) => {
            console.error('Error actualizando producto:', error);
            this.error = error?.error?.mensaje || 'No fue posible actualizar el producto.';
          }
        });

    } else {

      this.productosService
        .crear(this.producto)
        .subscribe({
          next: () => {
            this.mensaje = 'Producto creado correctamente.';
            this.cargarProductos();
            this.mostrarFormulario = false;
            this.producto = this.nuevoProducto();
          },
          error: (error: any) => {
            console.error('Error creando producto:', error);
            this.error = error?.error?.mensaje || 'No fue posible crear el producto.';
          }
        });
    }
  }

  eliminarProducto(producto: Producto): void {

    if (!producto.IdProducto) {
      return;
    }

    const confirmar = confirm(
      `¿Está seguro de eliminar el producto "${producto.NombreProducto}"?`
    );

    if (!confirmar) {
      return;
    }

    this.productosService
      .eliminar(producto.IdProducto)
      .subscribe({
        next: () => {
          this.mensaje = 'Producto eliminado correctamente.';
          this.cargarProductos();
        },
        error: (error: any) => {
          console.error('Error eliminando producto:', error);
          this.error = error?.error?.mensaje || 'No fue posible eliminar el producto.';
        }
      });
  }

  // ==================================================
  // CATEGORÍAS
  // ==================================================

  nuevaCategoriaForm(): void {

    this.categoria = this.nuevaCategoria();

    this.editandoCategoria = false;
    this.mostrarFormularioCategoria = true;

    this.mensaje = '';
    this.error = '';
  }

  editarCategoria(categoria: CategoriaProducto): void {

    this.categoria = { ...categoria };

    this.editandoCategoria = true;
    this.mostrarFormularioCategoria = true;

    this.mensaje = '';
    this.error = '';
  }

  cancelarCategoria(): void {

    this.categoria = this.nuevaCategoria();

    this.editandoCategoria = false;
    this.mostrarFormularioCategoria = false;

    this.mensaje = '';
    this.error = '';
  }

  guardarCategoria(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.categoria.Nombre || !this.categoria.Nombre.trim()) {
      this.error = 'El nombre de la categoría es obligatorio.';
      return;
    }

    if (this.editandoCategoria && this.categoria.IdCategoriaProducto) {

      this.categoriasService
        .actualizar(this.categoria.IdCategoriaProducto, this.categoria)
        .subscribe({
          next: () => {
            this.mensaje = 'Categoría actualizada correctamente.';
            this.cargarCategorias();
            this.mostrarFormularioCategoria = false;
            this.editandoCategoria = false;
            this.categoria = this.nuevaCategoria();
          },
          error: (error: any) => {
            console.error('Error actualizando categoría:', error);
            this.error = error?.error?.mensaje || 'No fue posible actualizar la categoría.';
          }
        });

    } else {

      this.categoriasService
        .crear(this.categoria)
        .subscribe({
          next: () => {
            this.mensaje = 'Categoría creada correctamente.';
            this.cargarCategorias();
            this.mostrarFormularioCategoria = false;
            this.categoria = this.nuevaCategoria();
          },
          error: (error: any) => {
            console.error('Error creando categoría:', error);
            this.error = error?.error?.mensaje || 'No fue posible crear la categoría.';
          }
        });
    }
  }

  eliminarCategoria(categoria: CategoriaProducto): void {

    if (!categoria.IdCategoriaProducto) {
      return;
    }

    const confirmar = confirm(
      `¿Está seguro de eliminar la categoría "${categoria.Nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    this.categoriasService
      .eliminar(categoria.IdCategoriaProducto)
      .subscribe({
        next: () => {
          this.mensaje = 'Categoría eliminada correctamente.';
          this.cargarCategorias();
        },
        error: (error: any) => {
          console.error('Error eliminando categoría:', error);
          this.error = error?.error?.mensaje || 'No fue posible eliminar la categoría.';
        }
      });
  }

  // ==================================================
  // MARCAS
  // ==================================================

  nuevaMarcaForm(): void {

    this.marca = this.nuevaMarca();

    this.editandoMarca = false;
    this.mostrarFormularioMarca = true;

    this.mensaje = '';
    this.error = '';
  }

  editarMarca(marca: Marca): void {

    this.marca = { ...marca };

    this.editandoMarca = true;
    this.mostrarFormularioMarca = true;

    this.mensaje = '';
    this.error = '';
  }

  cancelarMarca(): void {

    this.marca = this.nuevaMarca();

    this.editandoMarca = false;
    this.mostrarFormularioMarca = false;

    this.mensaje = '';
    this.error = '';
  }

  guardarMarca(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.marca.Nombre || !this.marca.Nombre.trim()) {
      this.error = 'El nombre de la marca es obligatorio.';
      return;
    }

    if (this.editandoMarca && this.marca.Id) {

      this.marcasService
        .actualizar(this.marca.Id, this.marca)
        .subscribe({
          next: () => {
            this.mensaje = 'Marca actualizada correctamente.';
            this.cargarMarcas();
            this.mostrarFormularioMarca = false;
            this.editandoMarca = false;
            this.marca = this.nuevaMarca();
          },
          error: (error: any) => {
            console.error('Error actualizando marca:', error);
            this.error = error?.error?.mensaje || 'No fue posible actualizar la marca.';
          }
        });

    } else {

      this.marcasService
        .crear(this.marca)
        .subscribe({
          next: () => {
            this.mensaje = 'Marca creada correctamente.';
            this.cargarMarcas();
            this.mostrarFormularioMarca = false;
            this.marca = this.nuevaMarca();
          },
          error: (error: any) => {
            console.error('Error creando marca:', error);
            this.error = error?.error?.mensaje || 'No fue posible crear la marca.';
          }
        });
    }
  }

  eliminarMarca(marca: Marca): void {

    if (!marca.Id) {
      return;
    }

    const confirmar = confirm(
      `¿Está seguro de eliminar la marca "${marca.Nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    this.marcasService
      .eliminar(marca.Id)
      .subscribe({
        next: () => {
          this.mensaje = 'Marca eliminada correctamente.';
          this.cargarMarcas();
        },
        error: (error: any) => {
          console.error('Error eliminando marca:', error);
          this.error = error?.error?.mensaje || 'No fue posible eliminar la marca.';
        }
      });
  }

  // ==================================================
  // UNIDADES DE MEDIDA
  // ==================================================

  nuevaUnidadMedidaForm(): void {

    this.unidadMedida = this.nuevaUnidadMedida();

    this.editandoUnidadMedida = false;
    this.mostrarFormularioUnidadMedida = true;

    this.mensaje = '';
    this.error = '';
  }

  editarUnidadMedida(unidad: UnidadMedida): void {

    this.unidadMedida = { ...unidad };

    this.editandoUnidadMedida = true;
    this.mostrarFormularioUnidadMedida = true;

    this.mensaje = '';
    this.error = '';
  }

  cancelarUnidadMedida(): void {

    this.unidadMedida = this.nuevaUnidadMedida();

    this.editandoUnidadMedida = false;
    this.mostrarFormularioUnidadMedida = false;

    this.mensaje = '';
    this.error = '';
  }

  guardarUnidadMedida(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.unidadMedida.Unidad || !this.unidadMedida.Unidad.trim()) {
      this.error = 'La unidad de medida es obligatoria.';
      return;
    }

    if (this.editandoUnidadMedida && this.unidadMedida.Id) {

      this.unidadesMedidaService
        .actualizar(this.unidadMedida.Id, this.unidadMedida)
        .subscribe({
          next: () => {
            this.mensaje = 'Unidad de medida actualizada correctamente.';
            this.cargarUnidadesMedida();
            this.mostrarFormularioUnidadMedida = false;
            this.editandoUnidadMedida = false;
            this.unidadMedida = this.nuevaUnidadMedida();
          },
          error: (error: any) => {
            console.error('Error actualizando unidad de medida:', error);
            this.error = error?.error?.mensaje || 'No fue posible actualizar la unidad de medida.';
          }
        });

    } else {

      this.unidadesMedidaService
        .crear(this.unidadMedida)
        .subscribe({
          next: () => {
            this.mensaje = 'Unidad de medida creada correctamente.';
            this.cargarUnidadesMedida();
            this.mostrarFormularioUnidadMedida = false;
            this.unidadMedida = this.nuevaUnidadMedida();
          },
          error: (error: any) => {
            console.error('Error creando unidad de medida:', error);
            this.error = error?.error?.mensaje || 'No fue posible crear la unidad de medida.';
          }
        });
    }
  }

  eliminarUnidadMedida(unidad: UnidadMedida): void {

    if (!unidad.Id) {
      return;
    }

    const confirmar = confirm(
      `¿Está seguro de eliminar la unidad de medida "${unidad.Unidad}"?`
    );

    if (!confirmar) {
      return;
    }

    this.unidadesMedidaService
      .eliminar(unidad.Id)
      .subscribe({
        next: () => {
          this.mensaje = 'Unidad de medida eliminada correctamente.';
          this.cargarUnidadesMedida();
        },
        error: (error: any) => {
          console.error('Error eliminando unidad de medida:', error);
          this.error = error?.error?.mensaje || 'No fue posible eliminar la unidad de medida.';
        }
      });
  }
}