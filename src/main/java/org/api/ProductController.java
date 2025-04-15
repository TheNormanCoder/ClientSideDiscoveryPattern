package org.api;

// File: api.org.ProductController.java

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

