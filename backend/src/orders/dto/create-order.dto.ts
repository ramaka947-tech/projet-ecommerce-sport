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
  deliveryFee?: number;
  paymentMethod: string;
  customerId?: string;
  items: { productId: string; quantity: number }[];
}