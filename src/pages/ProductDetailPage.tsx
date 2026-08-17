import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { money } from '../api/format';
import { useAuth } from '../auth/AuthContext';
import type { Product, UpdateProductDto } from '../types/product';

async function fetchProduct(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/api/products/${id}`);
    return response.data;
}

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [formError, setFormError] = useState('');

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['products', id],
        queryFn: () => fetchProduct(id as string),
        enabled: Boolean(id),
    });

    // Seed the edit fields once the product arrives.
    useEffect(() => {
        if (data) {
            setName(data.name);
            setDescription(data.description ?? '');
            setPrice(String(data.price));
        }
    }, [data]);

    const update = useMutation({
        mutationFn: (dto: UpdateProductDto) =>
            apiClient.put(`/api/products/${id}`, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    const remove = useMutation({
        mutationFn: () => apiClient.delete(`/api/products/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            navigate('/products');
        },
    });

    function handleSave(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError('');

        const parsedPrice = Number(price);
        if (!name.trim()) {
            setFormError('Name is required.');
            return;
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            setFormError('Price must be a positive number.');
            return;
        }

        update.mutate({
            name: name.trim(),
            description: description.trim() || null,
            price: parsedPrice,
        });
    }

    if (isLoading) {
        return <div>Loading product…</div>;
    }

    if (isError) {
        return <div className="form-error">Error: {(error as Error).message}</div>;
    }

    if (!data) {
        return <div>Not found.</div>;
    }

    return (
        <div>
            <p className="muted">
                <Link to="/products">Back to products</Link>
            </p>

            <h1>{data.name}</h1>
            <p className="muted">{data.description ?? 'No description.'}</p>

            <dl className="detail">
                <dt>Price</dt>
                <dd>{money(data.price)}</dd>
                <dt>In stock</dt>
                <dd>{data.stockQuantity}</dd>
                <dt>Id</dt>
                <dd className="mono">{data.id}</dd>
            </dl>

            {isAdmin && (
                <form className="form" onSubmit={handleSave}>
                    <h2>Edit</h2>
                    {formError && <div className="form-error">{formError}</div>}
                    {update.isError && (
                        <div className="form-error">{(update.error as Error).message}</div>
                    )}
                    {update.isSuccess && !update.isPending && (
                        <p className="muted">Saved.</p>
                    )}

                    <div className="form-field">
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="description">Description</label>
                        <input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="price">Price</label>
                        <input
                            id="price"
                            inputMode="decimal"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>

                    <div className="button-row">
                        <button type="submit" className="primary" disabled={update.isPending}>
                            {update.isPending ? 'Saving…' : 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={() => remove.mutate()}
                            disabled={remove.isPending}
                        >
                            Delete
                        </button>
                    </div>

                    <p className="muted small">
                        Stock is not editable here. It changes when orders are placed.
                    </p>
                </form>
            )}
        </div>
    );
}
