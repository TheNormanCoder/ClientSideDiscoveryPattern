# Il Pattern Client-Side Discovery

## Introduzione

Il Client-Side Discovery è un pattern architetturale fondamentale nei sistemi distribuiti, particolarmente rilevante nelle architetture a microservizi. Originariamente documentato e diffuso da Chris Richardson, questo pattern affronta una delle sfide principali nei sistemi distribuiti: come un cliente (sia esso un'applicazione frontend o un altro servizio backend) possa trovare e connettersi ad istanze di servizi in un ecosistema dinamico.

## Cosa è il Client-Side Discovery Pattern?

Nel Client-Side Discovery Pattern, il client è responsabile di:
1. Determinare gli indirizzi disponibili delle istanze di servizio
2. Bilanciare il carico tra diverse istanze disponibili
3. Gestire i fallimenti quando le istanze non sono disponibili

Il pattern si basa su tre componenti principali:
- **Service Registry**: un database centralizzato che mantiene un registro di tutte le istanze di servizio disponibili
- **Service Provider**: i servizi che si registrano nel registry
- **Service Consumer (Client)**: i componenti che interrogano il registry per trovare le istanze dei servizi necessari

## Come Funziona

Il flusso operativo è il seguente:

1. **Registrazione**: I service provider si registrano nel service registry quando vengono avviati, fornendo informazioni come l'hostname, l'indirizzo IP, la porta e eventuali metadati aggiuntivi.

2. **Heartbeat**: I service provider inviano periodicamente segnali di "heartbeat" al registry per confermare che sono ancora attivi.

3. **Deregistrazione**: Quando un'istanza di servizio viene terminata in modo appropriato, si deregistra dal registry.

4. **Discovery**: Il client interroga il service registry per trovare tutte le istanze disponibili di un determinato servizio.

5. **Selezione e bilanciamento**: Il client sceglie un'istanza specifica utilizzando un algoritmo di load balancing (round-robin, casuale, peso, ecc.).

6. **Invocazione**: Il client invia la richiesta direttamente all'istanza di servizio selezionata.

7. **Fallback**: Se l'istanza selezionata non risponde, il client può provare con un'altra istanza disponibile.

## Implementazioni Comuni

### 1. Spring Cloud Netflix (Eureka)

```java
// Service Provider
@SpringBootApplication
@EnableDiscoveryClient
public class org.ProductServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(org.ProductServiceApplication.class, args);
    }
}

// Client
@RestController
public class api.org.OrderController {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    
    @GetMapping("/order/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable String id) {
        // Usa il nome logico del servizio invece dell'indirizzo fisico
        ProductDto product = restTemplate.getForObject("http://product-service/products/{id}", 
                                                      ProductDto.class, id);
        // Crea e restituisci l'ordine
    }
}
```

### 2. Client JavaScript (Frontend)

```javascript
class ServiceDiscoveryClient {
  constructor(serviceRegistryUrl) {
    this.serviceRegistryUrl = serviceRegistryUrl;
    this.serviceCache = {};
  }

  async getServiceUrl(serviceName) {
    // Interroga il service registry
    const response = await fetch(`${this.serviceRegistryUrl}/services/${serviceName}`);
    const instances = await response.json();
    
    // Implementa un semplice load balancing
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex].url;
  }
  
  async callService(serviceName, endpoint, options = {}) {
    const serviceUrl = await this.getServiceUrl(serviceName);
    const url = `${serviceUrl}${endpoint}`;
    
    return fetch(url, options);
  }
}

// Uso in un'applicazione React
function ProductList() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    const discoveryClient = new ServiceDiscoveryClient('/registry');
    discoveryClient.callService('product-service', '/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);
  
  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}
```

## Vantaggi

1. **Decentralizzazione**: Il carico di lavoro del routing è distribuito tra i client, anziché essere centralizzato in un unico punto di fallimento.

2. **Flessibilità**: I client possono implementare strategie personalizzate di load balancing e fallback.

3. **Minore latenza**: Eliminando un intermediario (come un load balancer esterno), potenzialmente si riduce la latenza.

4. **Resilienza**: Se implementato correttamente con meccanismi di cache, il sistema può continuare a funzionare anche in caso di problemi temporanei con il service registry.

## Svantaggi

1. **Complessità lato client**: Il client deve implementare la logica di discovery, selezione e fallback.

2. **Accoppiamento**: Il client deve conoscere il protocollo del service registry.

3. **Duplicazione**: La logica di discovery deve essere implementata in ogni linguaggio di programmazione utilizzato dai client.

4. **Sicurezza**: Esporre il service registry a tutti i client potrebbe sollevare problemi di sicurezza.

## Evoluzione del Pattern

Il pattern Client-Side Discovery si è evoluto negli anni, adattandosi alle nuove tecnologie:

1. **Container e orchestratori**: Con l'avvento di Kubernetes, il pattern è stato adattato utilizzando i servizi Kubernetes come livello di discovery.

2. **Service Mesh**: Tecnologie come Istio, Linkerd e Consul hanno spostato parte della complessità del client-side discovery nei sidecar proxy, mantenendo però il concetto di base.

3. **API Gateway**: L'introduzione di API Gateway ha portato a pattern ibridi dove il gateway implementa parte della logica di discovery.

## Casi d'uso reali

1. **Netflix**: Utilizza Eureka per il client-side discovery nella sua architettura di microservizi.

2. **Airbnb**: Ha utilizzato SmartStack (Nerve e Synapse) per implementare il client-side discovery.

3. **SoundCloud**: Ha sviluppato e utilizzato Prometheus originariamente con un modello di client-side discovery.

4. **Shopify**: Ha adottato il client-side discovery come parte della loro architettura a microservizi.

5. **Alibaba**: Utilizza Nacos per il service discovery.

6. **Lyft**: Ha sviluppato Envoy, che supporta anche il client-side discovery pattern.

## Alternative

Il principale pattern alternativo è il **Server-Side Discovery**, in cui un load balancer o API gateway centralizzato si occupa di scoprire le istanze di servizio e di inoltrare le richieste. Questo semplifica il client ma introduce un potenziale single point of failure e un ulteriore hop nella comunicazione.

## Conclusione

Il Client-Side Discovery pattern rimane rilevante e ampiamente utilizzato nelle architetture moderne, anche se spesso in forme evolute o ibride. La sua flessibilità e capacità di adattarsi a diversi contesti lo rendono un pattern fondamentale per costruire sistemi distribuiti resilienti e scalabili.

La scelta tra Client-Side Discovery e pattern alternativi dipende dalle specifiche esigenze del sistema, considerando fattori come la complessità accettabile lato client, requisiti di performance, e strategie di resilienza complessive.
