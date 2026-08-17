// The API serialises enums as strings (JsonStringEnumConverter), so status
// arrives as "Pending" rather than 0.
export type OrderStatus = 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
    'Pending',
    'Shipped',
    'Delivered',
    'Cancelled',
];

export interface OrderItem {
    productId: string;
    quantity: number;
    priceAtOrder: number;
}

export interface Order {
    id: string;
    customerName: string;
    status: OrderStatus;
    createdAt: string;
    total: number;
    items: OrderItem[];
}

export interface CreateOrderItemDto {
    productId: string;
    quantity: number;
}

export interface CreateOrderDto {
    customerName: string;
    items: CreateOrderItemDto[];
}

export interface UpdateOrderStatusDto {
    status: OrderStatus;
}
