import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TiendaService } from '../../services/tienda';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, NgClass, RouterLink],
  templateUrl: './detalle.html',
  styleUrl: './detalle.css'
})
export class Detalle implements OnInit {
  private route = inject(ActivatedRoute);
  private tiendaService = inject(TiendaService);
  private cdr = inject(ChangeDetectorRef);

  pedido?: Pedido;
  cargando = true;
  noEncontrado = false;
  cancelando = false;
  mensajeError = '';
  mensajeExito = '';

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = Number(rawId);

    if (!rawId || isNaN(id) || id <= 0) {
      this.noEncontrado = true;
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    await this.cargarPedido(id);
  }

  private async cargarPedido(id: number): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';
    this.cdr.detectChanges();

    try {
      const encontrado = await this.tiendaService.getPedidoById(id);

      if (!encontrado) {
        this.noEncontrado = true;
        this.pedido = undefined;
      } else {
        this.noEncontrado = false;
        this.pedido = encontrado;
      }
    } catch (error) {
      console.error('Error al cargar el pedido:', error);
      this.noEncontrado = true;
      this.pedido = undefined;
      this.mensajeError = 'Ocurrió un error al consultar el pedido.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  async cancelarPedidoActual(): Promise<void> {
    if (!this.pedido || this.pedido.estado !== 'Confirmado') {
      return;
    }

    this.mensajeError = '';
    this.mensajeExito = '';
    this.cancelando = true;
    this.cdr.detectChanges();

    try {
      const resultado = await this.tiendaService.cancelarPedido(this.pedido.id);

      if (!resultado.ok) {
        this.mensajeError = resultado.mensaje;
        return;
      }

      this.mensajeExito = resultado.mensaje;
      await this.cargarPedido(this.pedido.id);
    } catch (error) {
      console.error('Error al cancelar el pedido:', error);
      this.mensajeError = 'No se pudo cancelar el pedido.';
    } finally {
      this.cancelando = false;
      this.cdr.detectChanges();
    }
  }
}