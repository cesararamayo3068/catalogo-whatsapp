package com.catalog.product;

import static com.catalog.product.ProductDtos.*;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProductController {

  private final ProductService service;

  public ProductController(ProductService service) {
    this.service = service;
  }

  @GetMapping("/api/public/products")
  public PageView list(
    @RequestParam(defaultValue = "") String query,
    @RequestParam(required = false) Long category,
    @RequestParam(required = false) Boolean featured,
    @RequestParam(required = false) Boolean available,
    @RequestParam(defaultValue = "newest") String sort,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "12") int size
  ) {
    return service.list(
      false,
      query,
      category,
      featured,
      available,
      sort,
      page,
      size
    );
  }

  @GetMapping("/api/admin/products")
  public PageView adminList(
    @RequestParam(defaultValue = "") String query,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return service.list(true, query, null, null, null, "newest", page, size);
  }

  @GetMapping("/api/public/products/{id}")
  public View detail(@PathVariable long id) {
    return service.detail(id, false);
  }

  @GetMapping("/api/admin/products/{id}")
  public View adminDetail(@PathVariable long id) {
    return service.detail(id, true);
  }

  @PostMapping("/api/admin/products")
  @ResponseStatus(HttpStatus.CREATED)
  public View create(@Valid @RequestBody Input input) {
    return service.save(null, input);
  }

  @PutMapping("/api/admin/products/{id}")
  public View update(@PathVariable long id, @Valid @RequestBody Input input) {
    return service.save(id, input);
  }

  @DeleteMapping("/api/admin/products/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable long id) {
    service.delete(id);
  }
}
