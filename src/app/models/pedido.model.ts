export type EstadoPedido = 'Confirmado' | 'Cancelado';

export interface ItemPedido {
  productoId: number;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  cliente: string;
  fecha: string;
  estado: EstadoPedido;
  items: ItemPedido[];
  total: number;
}