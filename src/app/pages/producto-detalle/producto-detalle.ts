import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Producto } from '../../models/producto.model';
import { TiendaService } from '../../services/tienda';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './producto-detalle.html'
})
export class ProductoDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tiendaService = inject(TiendaService);

  producto = signal<Producto | undefined>(undefined);
  cargando = signal(true);

  descripcionDetalle = computed(() => {
    const p = this.producto();
    if (!p) return '';

    const cat = (p.categoria ?? '').toLowerCase();
    if (cat.includes('cardio')) {
      return 'Ideal para entrenamientos de resistencia, coordinación y sesiones de alta intensidad.';
    }
    if (cat.includes('fuerza')) {
      return 'Construido para soportar cargas progresivas y rutinas constantes en casa o gimnasio.';
    }
    return 'Complemento práctico para mejorar rendimiento y movilidad en tus rutinas diarias.';
  });

  async ngOnInit(): Promise<void> {
    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      const productos = await this.tiendaService.getProductos();
      this.producto.set(productos.find(p => Number(p.id) === id));
    } catch (err) {
      console.error('Error cargando producto:', err);
    } finally {
      this.cargando.set(false);
    }
  }
}