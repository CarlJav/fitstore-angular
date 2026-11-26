import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ItemCarrito, TiendaService } from '../../services/tienda';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro implements OnInit {
  private fb = inject(FormBuilder);
  private tiendaService = inject(TiendaService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  productos: Producto[] = [];
  itemsPedido: ItemCarrito[] = [];
  mensajeError = '';
  mensajeExito = '';
  enviando = false;

  form = this.fb.group({
    cliente: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]{2,}(\s+[A-Za-zÁÉÍÓÚáéíóúÑñÜü]{2,})+$/)
      ]
    ],
    celular: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[67][0-9]{7}$/)
      ]
    ],
    productoId: [null as number | null, [Validators.required]],
    cantidad: [1, [Validators.required, Validators.min(1)]]
  });


  async ngOnInit(): Promise<void> {
    this.productos = await this.tiendaService.getProductos();
    this.itemsPedido = this.tiendaService.getCarrito();

    const primeroEnCarrito =
      this.itemsPedido.length > 0
        ? this.productos.find(p => p.id === this.itemsPedido[0].productoId && p.stock > 0)
        : undefined;

    const productoInicial = primeroEnCarrito ?? this.productos.find(p => p.stock > 0);
    if (productoInicial) {
      this.form.patchValue({ productoId: productoInicial.id, cantidad: 1 });
    }

    this.cdr.detectChanges();
  }


  get productoSeleccionado(): Producto | undefined {
    const id = Number(this.form.value.productoId);
    return this.productos.find(p => p.id === id);
  }

  get subtotalEstimado(): number {
    return this.itemsPedido.reduce((acum, item) => {
      const prod = this.obtenerProducto(item.productoId);
      return acum + (prod ? prod.precio * item.cantidad : 0);
    }, 0);
  }

  obtenerProducto(productoId: number): Producto | undefined {
    return this.productos.find(p => p.id === productoId);
  }

  soloNumerosCelular(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/[^0-9]/g, '').slice(0, 8);
    input.value = limpio;
    this.form.controls.celular.setValue(limpio);
  }

  agregarProducto(): void {
    this.mensajeError = '';

    const productoId = Number(this.form.value.productoId);
    const cantidad = Number(this.form.value.cantidad);
    const prod = this.productos.find(p => p.id === productoId);

    if (!prod) {
      this.mensajeError = 'Selecciona un producto válido.';
      return;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      this.mensajeError = 'La cantidad debe ser un número entero mayor a 0.';
      return;
    }

    const existente = this.itemsPedido.find(i => i.productoId === productoId);
    const cantidadTotal = (existente ? existente.cantidad : 0) + cantidad;

    if (cantidadTotal > prod.stock) {
      this.mensajeError = `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock} unidades.`;
      return;
    }

    if (existente) {
      existente.cantidad = cantidadTotal;
    } else {
      this.itemsPedido.push({ productoId, cantidad });
    }

    this.tiendaService.agregarAlCarrito(prod, cantidad);
    this.form.patchValue({ cantidad: 1 });
    this.cdr.detectChanges();
  }

  quitarProducto(index: number): void {
    const eliminado = this.itemsPedido[index];
    this.itemsPedido.splice(index, 1);

    if (eliminado) {
      this.tiendaService.quitarDelCarrito(eliminado.productoId);
    }

    if (this.itemsPedido.length === 0) {
      const primeroConStock = this.productos.find(p => p.stock > 0);
      this.form.patchValue({
        productoId: primeroConStock ? primeroConStock.id : null,
        cantidad: 1
      });
    }

    this.cdr.detectChanges();
  }

  async guardarPedido(): Promise<void> {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.validarCliente()) {
      return;
    }

    if (!this.asegurarItemSeleccionado()) {
      return;
    }

    const cliente = (this.form.value.cliente ?? '').trim();
    const celular = (this.form.value.celular ?? '').trim();

    this.enviando = true;
    const resultado = await this.tiendaService.crearPedido(cliente, this.itemsPedido);
    this.enviando = false;

    if (!resultado.ok) {
      this.mensajeError = resultado.mensaje;
      this.cdr.detectChanges();
      return;
    }

    this.mensajeExito = `${resultado.mensaje} (Celular: ${celular})`;
    await this.resetearEstadoPedido();
    this.cdr.detectChanges();
  }

  irAlHistorial(): void {
    this.router.navigate(['/historial']);
  }

  // --- Helpers privados ---

  private validarCliente(): boolean {
    this.form.controls.cliente.markAsTouched();
    this.form.controls.celular.markAsTouched();

    if (this.form.controls.cliente.invalid || this.form.controls.celular.invalid) {
      this.mensajeError =
        'Revisa los datos del cliente: nombre y apellido (sin números) y celular de 8 dígitos iniciado en 6 o 7.';
      return false;
    }

    return true;
  }

  private asegurarItemSeleccionado(): boolean {
    if (this.itemsPedido.length === 0 && this.form.value.productoId) {
      this.agregarProducto();
      if (this.mensajeError) {
        this.cdr.detectChanges();
        return false;
      }
    }

    if (this.itemsPedido.length === 0) {
      this.mensajeError = 'Agrega al menos un producto al pedido antes de confirmar.';
      return false;
    }

    return true;
  }

  private async resetearEstadoPedido(): Promise<void> {
    this.tiendaService.limpiarCarrito();
    this.itemsPedido = [];
    this.productos = await this.tiendaService.getProductos();

    const primeroConStock = this.productos.find(p => p.stock > 0);
    this.form.reset({
      cliente: '',
      celular: '',
      productoId: primeroConStock ? primeroConStock.id : null,
      cantidad: 1
    });
  }
}