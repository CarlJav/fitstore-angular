import { Injectable } from '@angular/core';
import { Producto } from '../models/producto.model';
import { EstadoPedido, ItemPedido, Pedido } from '../models/pedido.model';
import { PRODUCTOS_INICIALES } from '../data/productos-iniciales';
import { IndexedDbHelper } from './indexed-db.helper';

export interface ItemCarrito {
  productoId: number;
  cantidad: number;
}

export interface ResultadoOperacion {
  ok: boolean;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private readonly storeProductos = 'productos';
  private readonly storePedidos = 'pedidos';

  private readonly dbHelper = new IndexedDbHelper('TiendaFitStoreDB', 2, [
    {
      name: this.storeProductos,
      keyPath: 'id',
      indexes: [
        { name: 'by_categoria', keyPath: 'categoria' },
        { name: 'by_nombre', keyPath: 'nombre' }
      ]
    },
    {
      name: this.storePedidos,
      keyPath: 'id',
      indexes: [{ name: 'by_estado', keyPath: 'estado' }]
    }
  ]);

  private carrito: ItemCarrito[] = [];

  // --- Gestión del carrito ---

  getCarrito(): ItemCarrito[] {
    return this.carrito.map(item => ({ ...item }));
  }

  getTotalUnidadesCarrito(): number {
    return this.carrito.reduce((acc, item) => acc + item.cantidad, 0);
  }

  agregarAlCarrito(producto: Producto, cantidad: number): ResultadoOperacion {
    if (producto.stock <= 0) {
      return { ok: false, mensaje: `"${producto.nombre}" está agotado.` };
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return { ok: false, mensaje: 'La cantidad debe ser un número entero mayor a 0.' };
    }

    const existente = this.carrito.find(i => i.productoId === producto.id);
    const nuevaCantidad = (existente ? existente.cantidad : 0) + cantidad;

    if (nuevaCantidad > producto.stock) {
      return {
        ok: false,
        mensaje: `Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock}).`
      };
    }

    if (existente) {
      existente.cantidad = nuevaCantidad;
    } else {
      this.carrito.push({ productoId: producto.id, cantidad });
    }

    return { ok: true, mensaje: `Añadido: ${cantidad} × ${producto.nombre}` };
  }

  quitarDelCarrito(productoId: number): void {
    this.carrito = this.carrito.filter(item => item.productoId !== productoId);
  }

  limpiarCarrito(): void {
    this.carrito = [];
  }

  // --- Consultas y pedidos ---

  async getProductos(): Promise<Producto[]> {
    const productos = await this.asegurarProductosIniciales();
    return productos.map(p => ({ ...p }));
  }

  async getPedidos(): Promise<Pedido[]> {
    await this.asegurarProductosIniciales();
    const pedidos = await this.dbHelper.leerTodos<Pedido>(this.storePedidos);
    return pedidos.sort((a, b) => b.id - a.id);
  }

  async getPedidoById(id: number): Promise<Pedido | undefined> {
    const pedidos = await this.getPedidos();
    return pedidos.find(p => p.id === id);
  }

  async crearPedido(
    cliente: string,
    itemsSolicitados: { productoId: number; cantidad: number }[]
  ): Promise<{ ok: boolean; mensaje: string; pedido?: Pedido }> {
    const nombreCliente = cliente.trim();
    if (!nombreCliente) {
      return { ok: false, mensaje: 'El nombre del cliente es obligatorio.' };
    }

    if (!itemsSolicitados || itemsSolicitados.length === 0) {
      return { ok: false, mensaje: 'Debes agregar al menos un producto al pedido.' };
    }

    const productosActuales = await this.asegurarProductosIniciales();
    const itemsConstruidos: ItemPedido[] = [];
    const productosActualizadosMap = new Map<number, Producto>(
      productosActuales.map(p => [p.id, { ...p }])
    );

    for (const req of itemsSolicitados) {
      const cant = Number(req.cantidad);
      if (!Number.isInteger(cant) || cant <= 0) {
        return { ok: false, mensaje: 'La cantidad debe ser un número entero mayor a 0.' };
      }

      const prod = productosActualizadosMap.get(req.productoId);
      if (!prod) {
        return { ok: false, mensaje: `Producto con ID ${req.productoId} no encontrado.` };
      }

      if (cant > prod.stock) {
        return {
          ok: false,
          mensaje: `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock}.`
        };
      }

      prod.stock -= cant;

      itemsConstruidos.push({
        productoId: prod.id,
        nombreProducto: prod.nombre,
        cantidad: cant,
        precioUnitario: prod.precio,
        subtotal: prod.precio * cant
      });
    }

    const pedidosExistentes = await this.dbHelper.leerTodos<Pedido>(this.storePedidos);
    const maxPedidoId = pedidosExistentes.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const totalPedido = itemsConstruidos.reduce((acc, item) => acc + item.subtotal, 0);

    const nuevoPedido: Pedido = {
      id: maxPedidoId + 1,
      cliente: nombreCliente,
      fecha: new Date().toISOString(),
      estado: 'Confirmado' as EstadoPedido,
      items: itemsConstruidos,
      total: totalPedido
    };

    await this.dbHelper.ejecutarTransaccion(
      [this.storeProductos, this.storePedidos],
      'readwrite',
      tx => {
        const prodStore = tx.objectStore(this.storeProductos);
        const pedStore = tx.objectStore(this.storePedidos);

        for (const prod of productosActualizadosMap.values()) {
          prodStore.put(prod);
        }
        pedStore.put(nuevoPedido);
      },
      'Error al guardar el pedido en IndexedDB.'
    );

    return {
      ok: true,
      mensaje: `Pedido #${nuevoPedido.id} registrado correctamente.`,
      pedido: nuevoPedido
    };
  }

  async cancelarPedido(id: number): Promise<ResultadoOperacion> {
    const pedidos = await this.dbHelper.leerTodos<Pedido>(this.storePedidos);
    const pedido = pedidos.find(p => p.id === id);

    if (!pedido) {
      return { ok: false, mensaje: `No se encontró el pedido #${id}.` };
    }

    if (pedido.estado === 'Cancelado') {
      return { ok: false, mensaje: `El pedido #${id} ya estaba cancelado.` };
    }

    const productosActuales = await this.asegurarProductosIniciales();
    const productosMap = new Map<number, Producto>(
      productosActuales.map(p => [p.id, { ...p }])
    );

    for (const item of pedido.items) {
      const prod = productosMap.get(item.productoId);
      if (prod) {
        prod.stock += item.cantidad;
      }
    }

    const pedidoCancelado: Pedido = {
      ...pedido,
      estado: 'Cancelado'
    };

    await this.dbHelper.ejecutarTransaccion(
      [this.storeProductos, this.storePedidos],
      'readwrite',
      tx => {
        const prodStore = tx.objectStore(this.storeProductos);
        const pedStore = tx.objectStore(this.storePedidos);

        for (const prod of productosMap.values()) {
          prodStore.put(prod);
        }
        pedStore.put(pedidoCancelado);
      },
      'Error al cancelar el pedido en IndexedDB.'
    );

    return {
      ok: true,
      mensaje: `Pedido #${id} cancelado. Se devolvió el stock correspondiente.`
    };
  }

  // --- Sincronización de catálogo inicial ---

  private normalizarProducto(prod: Producto): Producto {
    const imagenLimpia = prod.imagen?.trim();
    return {
      ...prod,
      ...(imagenLimpia ? { imagen: imagenLimpia } : { imagen: undefined })
    };
  }

  private async asegurarProductosIniciales(): Promise<Producto[]> {
    const actuales = await this.dbHelper.leerTodos<Producto>(this.storeProductos);
    const mapaActuales = new Map<number, Producto>(actuales.map(p => [p.id, p]));

    const sincronizados: Producto[] = PRODUCTOS_INICIALES.map(inicial => {
      const existente = mapaActuales.get(inicial.id);
      return this.normalizarProducto({
        ...inicial,
        stock: existente ? existente.stock : inicial.stock
      });
    });

    for (const actual of actuales) {
      if (!PRODUCTOS_INICIALES.some(p => p.id === actual.id)) {
        sincronizados.push(this.normalizarProducto(actual));
      }
    }

    sincronizados.sort((a, b) => a.id - b.id);

    await this.dbHelper.ejecutarTransaccion(
      this.storeProductos,
      'readwrite',
      tx => {
        const store = tx.objectStore(this.storeProductos);
        for (const prod of sincronizados) {
          store.put({ ...prod });
        }
      },
      'Error sincronizando productos iniciales.'
    );

    return sincronizados;
  }
}