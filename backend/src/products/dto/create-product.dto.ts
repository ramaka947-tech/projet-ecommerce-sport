export class CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  price: number;
  promoPrice?: number;
  stock?: number;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  isPublished?: boolean;
  categoryId: string;
}