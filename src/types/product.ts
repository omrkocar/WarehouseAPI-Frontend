// GET /api/Products and GET /api/Products/{id}
export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stockQuantity: number;
}

// POST /api/Products
export interface CreateProductDto {
    name: string;
    description: string | null;
    price: number;
    stockQuantity: number;
}

// PUT /api/Products/{id}
export interface UpdateProductDto {
    name: string;
    description: string | null;
    price: number;
}
