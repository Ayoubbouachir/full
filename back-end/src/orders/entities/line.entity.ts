import { Product } from '../../products/entities/product.entity';

export class Line {
  idLine: number;
  idProduct: string; // Changed to string for Product _id
  product?: Product;
  qnt: number;
  unitPrice: number;
  total: number;
}
