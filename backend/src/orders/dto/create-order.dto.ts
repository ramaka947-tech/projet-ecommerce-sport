export class OrderItemDto {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

export class CreateOrderDto {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  comment?: string;
  deliveryFee?: number;
  paymentMethod: string;
  customerId?: string;
  items: OrderItemDto[];
}