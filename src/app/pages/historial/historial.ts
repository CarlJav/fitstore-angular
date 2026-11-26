import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TiendaService } from '../../services/tienda';
import { Pedido, EstadoPedido } from '../../models/pedido.model';

type FiltroEstado = 'Todos' | EstadoPedido;

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, NgClass, RouterLink],
  templateUrl: './historial.html',
  styleUrl: './historial.css'
})
export class Historial implements OnInit {
  private tiendaService = inject(TiendaService);
  private cdr = inject(ChangeDetectorRef);

  pedidos: Pedido[] = [];
  filtroEstado: FiltroEstado = 'Todos';
  cargando = true;
  errorCarga = '';

  async ngOnInit(): Promise<void> {
    await this.cargarPedidos();
  }

  async cargarPedidos(): Promise<void> {
    this.cargando = true;
    this.errorCarga = '';
    this.cdr.detectChanges();

    try {
      this.pedidos = await this.tiendaService.getPedidos();
    } catch (error) {
      console.error('Error al cargar el historial de pedidos:', error);
      this.errorCarga = 'No se pudo cargar el historial de pedidos.';
      this.pedidos = [];
    } finally {
      this.cargando = false;
      // Forzamos a Angular a actualizar la vista apenas termina el await
      this.cdr.detectChanges();
    }
  }

  cambiarFiltro(estado: FiltroEstado): void {
    this.filtroEstado = estado;
    this.cdr.detectChanges();
  }

  get pedidosFiltrados(): Pedido[] {
    if (this.filtroEstado === 'Todos') {
      return this.pedidos;
    }
    return this.pedidos.filter(p => p.estado === this.filtroEstado);
  }

  get totalConfirmados(): number {
    return this.pedidos.filter(p => p.estado === 'Confirmado').length;
  }

  get totalCancelados(): number {
    return this.pedidos.filter(p => p.estado === 'Cancelado').length;
  }
}