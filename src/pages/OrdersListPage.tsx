import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { money, shortDate } from '../api/format';
import { useAuth } from '../auth/AuthContext';
import { NEXT_STATUSES, type Order, type OrderStatus } from '../types/order';

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
            // Cancelling returns stock to the catalogue, so that list is stale too.
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
                        {isAdmin && <th>Advance to</th>}
                    </tr>
                </thead>
                <tbody>
                    {data?.map((order) => {
                        const next = NEXT_STATUSES[order.status] ?? [];
                        return (
                            <tr key={order.id}>
                                <td>{order.customerName}</td>
                                <td className="muted">{shortDate(order.createdAt)}</td>
                                <td className="num">
                                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                                </td>
                                <td className="num">{money(order.total)}</td>
                                <td>
                                    <span className={`badge badge-${order.status.toLowerCase()}`}>
                                        {order.status}
                                    </span>
                                </td>
                                {isAdmin && (
                                    <td>
                                        {next.length === 0 ? (
                                            <span className="muted small">Final</span>
                                        ) : (
                                            <div className="button-row">
                                                {next.map((status) => (
                                                    <button
                                                        key={status}
                                                        type="button"
                                                        disabled={setStatus.isPending}
                                                        onClick={() =>
                                                            setStatus.mutate({ id: order.id, status })
                                                        }
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {data?.length === 0 && <p className="muted">No orders yet.</p>}
        </div>
    );
}
