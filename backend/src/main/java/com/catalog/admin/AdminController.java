package com.catalog.admin;

import com.catalog.category.CategoryRepository;
import com.catalog.product.ProductRepository;
import java.security.Principal;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
public class AdminController {

  private final ProductRepository products;
  private final CategoryRepository categories;

  public AdminController(
    ProductRepository products,
    CategoryRepository categories
  ) {
    this.products = products;
    this.categories = categories;
  }

  @GetMapping("/api/auth/me")
  public Map<String, String> me(Principal user) {
    return Map.of("username", user.getName());
  }

  @GetMapping("/api/admin/dashboard")
  public Map<String, Long> dashboard() {
    return Map.of(
      "products",
      products.count(),
      "categories",
      categories.count(),
      "active",
      products.countByActive(true),
      "inactive",
      products.countByActive(false),
      "unavailable",
      products.countByAvailableFalse()
    );
  }
}
