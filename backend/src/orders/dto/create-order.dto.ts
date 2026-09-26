export class OrderItemDto {
  productId: string;
  quantity: number;
}

export class CreateOrderDto {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  comment?: string;
  paymentMethod: string;
  deliveryFee?: number;
  items: OrderItemDto[];
}