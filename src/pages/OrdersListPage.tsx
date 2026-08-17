import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { money, shortDate } from '../api/format';
import { useAuth } from '../auth/AuthContext';
import { ORDER_STATUSES, type Order, type OrderStatus } from '../types/order';

async function fetchOrders(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/api/orders');
    return response.data;
}

export default function OrdersListPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const queryClient = useQueryClient();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['orders'],
        queryFn: fetchOrders,
    });

    const setStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
            apiClient.put(`/api/orders/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            // Cancelling an order returns its stock, so the catalogue is stale too.
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    if (isLoading) {
        return <div>Loading orders…</div>;
    }

    if (isError) {
        return <div className="form-error">Error: {(error as Error).message}</div>;
    }

    return (
        <div>
            <h1>Orders</h1>
            <p>{data?.length ?? 0} order(s).</p>

            {setStatus.isError && (
                <div className="form-error">{(setStatus.error as Error).message}</div>
            )}

            <table className="table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Placed</th>
                        <th className="num">Items</th>
                        <th className="num">Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data?.map((order) => (
                        <tr key={order.id}>
                            <td>{order.customerName}</td>
                            <td className="muted">{shortDate(order.createdAt)}</td>
                            <td className="num">
                                {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                            </td>
                            <td className="num">{money(order.total)}</td>
                            <td>
                                {isAdmin ? (
                                    <select
                                        value={order.status}
                                        disabled={setStatus.isPending}
                                        onChange={(e) =>
                                            setStatus.mutate({
                                                id: order.id,
                                                status: e.target.value as OrderStatus,
                                            })
                                        }
                                    >
                                        {ORDER_STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className={`badge badge-${order.status.toLowerCase()}`}>
                                        {order.status}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {data?.length === 0 && <p className="muted">No orders yet.</p>}
        </div>
    );
}
