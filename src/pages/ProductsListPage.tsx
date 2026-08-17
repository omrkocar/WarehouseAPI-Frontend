import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { money } from '../api/format';
import { useAuth } from '../auth/AuthContext';
import type { CreateProductDto, Product } from '../types/product';

async function fetchProducts(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/api/products');
    return response.data;
}

async function createProduct(dto: CreateProductDto): Promise<Product> {
    const response = await apiClient.post<Product>('/api/products', dto);
    return response.data;
}

async function deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/api/products/${id}`);
}

export default function ProductsListPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stockQuantity, setStockQuantity] = useState('');
    const [formError, setFormError] = useState('');

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
    });

    const create = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setName('');
            setDescription('');
            setPrice('');
            setStockQuantity('');
        },
    });

    const remove = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    });

    function handleCreate(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError('');

        const parsedPrice = Number(price);
        const parsedStock = Number(stockQuantity);

        if (!name.trim()) {
            setFormError('Name is required.');
            return;
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            setFormError('Price must be a positive number.');
            return;
        }
        if (!Number.isInteger(parsedStock) || parsedStock < 0) {
            setFormError('Stock must be a whole number.');
            return;
        }

        create.mutate({
            name: name.trim(),
            description: description.trim() || null,
            price: parsedPrice,
            stockQuantity: parsedStock,
        });
    }

    if (isLoading) {
        return <div>Loading products…</div>;
    }

    if (isError) {
        return <div className="form-error">Error: {(error as Error).message}</div>;
    }

    return (
        <div>
            <h1>Products</h1>
            <p>{data?.length ?? 0} product(s) in the warehouse.</p>

            {isAdmin && (
                <form className="inline-form" onSubmit={handleCreate}>
                    <h2>Add a product</h2>
                    {formError && <div className="form-error">{formError}</div>}
                    {create.isError && (
                        <div className="form-error">
                            {(create.error as Error).message}
                        </div>
                    )}
                    <div className="inline-fields">
                        <input
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <input
                            placeholder="Price"
                            inputMode="decimal"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                        <input
                            placeholder="Stock"
                            inputMode="numeric"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                        />
                        <button type="submit" className="primary" disabled={create.isPending}>
                            {create.isPending ? 'Adding…' : 'Add'}
                        </button>
                    </div>
                </form>
            )}

            <table className="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th className="num">Price</th>
                        <th className="num">Stock</th>
                        {isAdmin && <th />}
                    </tr>
                </thead>
                <tbody>
                    {data?.map((product) => (
                        <tr key={product.id}>
                            <td>
                                <Link to={`/products/${product.id}`}>{product.name}</Link>
                            </td>
                            <td className="muted">{product.description ?? '-'}</td>
                            <td className="num">{money(product.price)}</td>
                            <td className="num">{product.stockQuantity}</td>
                            {isAdmin && (
                                <td className="num">
                                    <button
                                        type="button"
                                        onClick={() => remove.mutate(product.id)}
                                        disabled={remove.isPending}
                                    >
                                        Delete
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {data?.length === 0 && <p className="muted">No products yet.</p>}
        </div>
    );
}
