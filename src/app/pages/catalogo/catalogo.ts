import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TiendaService } from '../../services/tienda';
import { Producto } from '../../models/producto.model';
import {
  ProductoCardComponent,
  SeleccionProducto
} from '../../components/producto-card/producto-card';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [FormsModule, ProductoCardComponent],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class CatalogoComponent implements OnInit {
  private tiendaService = inject(TiendaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  productos: Producto[] = [];
  textoBusqueda = '';
  categoriaSeleccionada = 'Todas';
  cargando = true;
  avisoCarrito = '';
  errorCarrito = '';

  async ngOnInit(): Promise<void> {
    this.route.queryParamMap.subscribe(params => {
      const categoriaUrl = params.get('categoria');
      if (categoriaUrl) {
        this.categoriaSeleccionada = categoriaUrl;
        this.cdr.detectChanges();
      }
    });

    this.cargando = true;
    this.cdr.detectChanges();

    try {
      this.productos = await this.tiendaService.getProductos();
    } catch (error) {
      console.error('Error al cargar productos:', error);
      this.productos = [];
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  get totalEnCarrito(): number {
    return this.tiendaService.getTotalUnidadesCarrito();
  }

  get categorias(): string[] {
    const unicas = new Set(this.productos.map(p => p.categoria));
    return ['Todas', ...Array.from(unicas)];
  }

  get productosFiltrados(): Producto[] {
    const termino = this.textoBusqueda.trim().toLowerCase();

    return this.productos.filter(prod => {
      const coincideTexto =
        !termino ||
        prod.nombre.toLowerCase().includes(termino) ||
        prod.descripcion.toLowerCase().includes(termino);

      const coincideCategoria =
        this.categoriaSeleccionada === 'Todas' ||
        prod.categoria === this.categoriaSeleccionada;

      return coincideTexto && coincideCategoria;
    });
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.categoriaSeleccionada = 'Todas';
    this.cdr.detectChanges();
  }

  anadirProducto({ producto, cantidad }: SeleccionProducto): void {
    this.avisoCarrito = '';
    this.errorCarrito = '';

    const res = this.tiendaService.agregarAlCarrito(producto, cantidad);
    if (!res.ok) {
      this.errorCarrito = res.mensaje;
    } else {
      this.avisoCarrito = `${res.mensaje} (Total en pedido: ${this.totalEnCarrito})`;
    }
    this.cdr.detectChanges();
  }

  pedirProducto({ producto, cantidad }: SeleccionProducto): void {
    this.errorCarrito = '';
    const res = this.tiendaService.agregarAlCarrito(producto, cantidad);

    if (!res.ok && this.totalEnCarrito === 0) {
      this.errorCarrito = res.mensaje;
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(['/registrar']);
  }

  irARegistrar(): void {
    this.router.navigate(['/registrar']);
  }
}