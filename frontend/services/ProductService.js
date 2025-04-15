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


export default ProductService;