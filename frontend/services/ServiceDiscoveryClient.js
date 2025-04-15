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
