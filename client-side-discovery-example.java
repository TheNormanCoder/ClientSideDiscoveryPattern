// Esempio di implementazione del Client-Side Discovery Pattern con Spring Cloud e Netflix Eureka

// 1. Configurazione del Service Registry (Eureka Server)
// File: EurekaServerApplication.java
package com.example.serviceregistry;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}

// application.yml per Eureka Server
/*
server:
  port: 8761

eureka:
  client:
    registerWithEureka: false
    fetchRegistry: false
  server:
    waitTimeInMsWhenSyncEmpty: 0
*/

// 2. Configurazione del Service Provider (registrato con Eureka)
// File: ProductServiceApplication.java
package com.example.productservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ProductServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}

// File: ProductController.java
package com.example.productservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/products")
public class ProductController {
    
    @GetMapping("/{id}")
    public String getProduct(@PathVariable String id) {
        return "Product " + id + " from instance " + System.getenv("HOSTNAME");
    }
}

// application.yml per Product Service
/*
spring:
  application:
    name: product-service
server:
  port: 0  # Porta random per poter avviare multiple istanze

eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
  instance:
    instanceId: ${spring.application.name}:${random.value}
*/

// 3. Implementazione del Client-Side Discovery Pattern
// File: OrderServiceApplication.java
package com.example.orderservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableDiscoveryClient
public class OrderServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
    
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

// File: OrderController.java (client che usa il client-side discovery)
package com.example.orderservice.controller;

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

// application.yml per Order Service
/*
spring:
  application:
    name: order-service
server:
  port: 8080

eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
*/

// Dipendenze da aggiungere al pom.xml
/*
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
*/
