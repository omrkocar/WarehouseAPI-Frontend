// The API serialises enums as strings (JsonStringEnumConverter), so status
// arrives as "Pending" rather than 1.
export type OrderStatus =
    | 'Pending'
    | 'Paid'
    | 'Shipped'
    | 'Delivered'
    | 'Cancelled';

// Mirrors Order.CanTransitionTo on the server. Anything not listed here is
// rejected with a 400, so the UI only offers moves the API will accept.
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
    Pending: ['Paid', 'Cancelled'],
    Paid: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered'],
    Delivered: [],
    Cancelled: [],
};

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
