import { Component, input, output, signal } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { Producto } from '../../models/producto.model';
import { RouterLink } from '@angular/router';

export interface SeleccionProducto {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CurrencyPipe, NgClass, RouterLink],
  templateUrl: './producto-card.html',
  styleUrl: './producto-card.css'
})
export class ProductoCardComponent {
  producto = input.required<Producto>();
  anadir = output<SeleccionProducto>();
  pedir = output<SeleccionProducto>();

  cantidad = signal(1);

  aumentar(): void {
    if (this.cantidad() < this.producto().stock) {
      this.cantidad.update(c => c + 1);
    }
  }

  disminuir(): void {
    if (this.cantidad() > 1) {
      this.cantidad.update(c => c - 1);
    }
  }

  alAnadir(): void {
    if (this.producto().stock > 0) {
      this.anadir.emit({
        producto: this.producto(),
        cantidad: this.cantidad()
      });
      this.cantidad.set(1);
    }
  }

  alPedir(): void {
    if (this.producto().stock > 0) {
      this.pedir.emit({
        producto: this.producto(),
        cantidad: this.cantidad()
      });
    }
  }
} 