package org.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private DiscoveryClient discoveryClient;

    // Approccio 1: Usando RestTemplate con @LoadBalanced (utilizza Netflix Ribbon sotto il cofano)
    @GetMapping("/product/{id}")
    public String getProductUsingLoadBalancedRestTemplate(@PathVariable String id) {
        // Qui usiamo direttamente il nome logico del servizio, non l'indirizzo fisico
        // Ribbon (integrato con Eureka) si occupa di risolvere il nome e bilanciare il carico
        String response = restTemplate.getForObject("http://product-service/products/{id}", String.class, id);
        return "Order service forwarded to: " + response;
    }

    // Approccio 2: Implementazione manuale del client-side discovery pattern
    @GetMapping("/product-manual/{id}")
    public String getProductManualDiscovery(@PathVariable String id) {
        // 1. Otteniamo la lista delle istanze disponibili per il servizio product-service
        List<ServiceInstance> instances = discoveryClient.getInstances("product-service");

        if (instances.isEmpty()) {
            return "No instances of product-service available";
        }

        // 2. Selezioniamo un'istanza (qui in modo molto semplice - la prima disponibile)
        // In una implementazione reale si userebbe un algoritmo di load balancing più sofisticato
        ServiceInstance serviceInstance = instances.get(0);

        // 3. Costruiamo l'URL completo a partire dall'istanza selezionata
        String url = serviceInstance.getUri().toString() + "/products/" + id;

        // 4. Effettuiamo la chiamata REST usando l'URL specifico
        RestTemplate plainRestTemplate = new RestTemplate();
        String response = plainRestTemplate.getForObject(url, String.class);

        return "Order service forwarded to: " + response + " using manual discovery";
    }
}
