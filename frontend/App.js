// ---------------------------------------------------
// File: App.jsx
// Componente React che utilizza il client per la discovery

import React, { useState, useEffect } from 'react';
import ServiceDiscoveryClient from './services/ServiceDiscoveryClient';
import ProductService from './services/ProductService';

const App = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Inizializza il client di discovery con l'URL del service registry
                const discoveryClient = new ServiceDiscoveryClient('http://service-registry-url');

                // Inizializza il servizio prodotti con il client di discovery
                const productService = new ProductService(discoveryClient);

                // Ottiene i prodotti usando client-side discovery
                const data = await productService.getAllProducts();
                setProducts(data);
                setLoading(false);
            } catch (err) {
                console.error('Errore nel caricamento dei prodotti:', err);
                setError('Impossibile caricare i prodotti. Si prega di riprovare più tardi.');
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) return <div>Caricamento in corso...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h1>Elenco Prodotti</h1>
            <ul>
                {products.map(product => (
                    <li key={product.id}>
                        {product.name} - €{product.price}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default App;