// File: ServiceDiscoveryClient.js
// Questo è un client JavaScript che implementa il pattern di client-side discovery

class ServiceDiscoveryClient {
  constructor(serviceRegistryUrl) {
    this.serviceRegistryUrl = serviceRegistryUrl;
    this.serviceCache = {};
    this.cacheTimeout = 30000; // 30 secondi di cache
  }

  // Metodo per ottenere l'URL di un servizio dal service registry
  async getServiceUrl(serviceName) {
    // Controlla se abbiamo una cache valida
    const cachedService = this.serviceCache[serviceName];
    if (cachedService && (Date.now() - cachedService.timestamp < this.cacheTimeout)) {
      console.log(`Usando istanza in cache per ${serviceName}: ${cachedService.url}`);
      return cachedService.url;
    }

    try {
      // Chiamata al service registry per ottenere tutte le istanze disponibili per il servizio
      const response = await fetch(`${this.serviceRegistryUrl}/eureka/apps/${serviceName}`);
      if (!response.ok) {
        throw new Error(`Errore nel recupero delle istanze per ${serviceName}`);
      }

      const data = await response.json();
      
      // Estrai le istanze dal JSON restituito da Eureka
      const instances = data.application.instance;
      
      if (!instances || instances.length === 0) {
        throw new Error(`Nessuna istanza disponibile per ${serviceName}`);
      }
      
      // Implementazione di un semplice load balancing: selezione random di un'istanza
      const randomIndex = Math.floor(Math.random() * instances.length);
      const selectedInstance = instances[randomIndex];
      
      // Costruisci l'URL dal protocollo e dalle informazioni dell'host/porta
      const url = `${selectedInstance.protocol}://${selectedInstance.ipAddr}:${selectedInstance.port.$}`;
      
      // Memorizza nella cache
      this.serviceCache[serviceName] = {
        url,
        timestamp: Date.now()
      };
      
      console.log(`Nuova istanza selezionata per ${serviceName}: ${url}`);
      return url;
    } catch (error) {
      console.error(`Errore durante la discovery del servizio ${serviceName}:`, error);
      throw error;
    }
  }
  
  // Metodo per effettuare una chiamata a un servizio utilizzando client-side discovery
  async callService(serviceName, endpoint, options = {}) {
    try {
      const serviceUrl = await this.getServiceUrl(serviceName);
      const url = `${serviceUrl}${endpoint}`;
      
      console.log(`Chiamata al servizio ${serviceName} all'endpoint ${url}`);
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`Errore nella chiamata a ${url}: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Errore durante la chiamata al servizio ${serviceName}:`, error);
      throw error;
    }
  }
}

// ---------------------------------------------------
// File: ProductService.js
// Un wrapper del servizio che utilizza ServiceDiscoveryClient

class ProductService {
  constructor(discoveryClient) {
    this.discoveryClient = discoveryClient;
    this.SERVICE_NAME = 'PRODUCT-SERVICE';
  }
  
  async getProduct(productId) {
    return this.discoveryClient.callService(
      this.SERVICE_NAME,
      `/products/${productId}`
    );
  }
  
  async getAllProducts() {
    return this.discoveryClient.callService(
      this.SERVICE_NAME,
      '/products'
    );
  }
}

// ---------------------------------------------------
// File: App.jsx
// Componente React che utilizza il client per la discovery

import React, { useState, useEffect } from 'react';
import ServiceDiscoveryClient from './ServiceDiscoveryClient';
import ProductService from './ProductService';

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

// ---------------------------------------------------
// NOTA: In una implementazione reale si potrebbero usare anche librerie come Eureka JS Client
// che semplificano l'integrazione con Eureka e implementano funzionalità aggiuntive.

// Esempio di alternativa usando eureka-js-client (da installare con npm):
// Questa è solo per riferimento, non fa parte dell'implementazione sopra.

/*
import { Eureka } from 'eureka-js-client';

// Configurazione del client Eureka
const client = new Eureka({
  instance: {
    app: 'frontend-app',
    hostName: 'localhost',
    ipAddr: '127.0.0.1',
    port: 3000,
    vipAddress: 'frontend-app',
    dataCenterInfo: {
      name: 'MyOwn'
    }
  },
  eureka: {
    host: 'service-registry-host',
    port: 8761,
    servicePath: '/eureka/apps/'
  }
});

// Avvio del client
client.start();

// Per ottenere le istanze
const instances = client.getInstancesByAppId('PRODUCT-SERVICE');
*/
