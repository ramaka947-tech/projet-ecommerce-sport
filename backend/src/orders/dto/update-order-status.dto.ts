import { OrderStatus } from '../../generated/prisma/enums.js';

export class UpdateOrderStatusDto {
  status: OrderStatus;
}