package com.catalog.category;

import com.catalog.common.ApiException;
import com.catalog.product.ProductRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@Transactional
public class CategoryController {

  public record CategoryInput(
    @NotBlank @Size(max = 100) String name,
    boolean active,
    @Min(0) @Max(100000) int sortOrder
  ) {}

  public record CategoryView(
    Long id,
    String name,
    boolean active,
    int sortOrder
  ) {
    static CategoryView from(Category c) {
      return new CategoryView(c.id, c.name, c.active, c.sortOrder);
    }
  }

  private final CategoryRepository categories;
  private final ProductRepository products;

  public CategoryController(
    CategoryRepository categories,
    ProductRepository products
  ) {
    this.categories = categories;
    this.products = products;
  }

  @GetMapping("/api/public/categories")
  public List<CategoryView> publicList() {
    return categories
      .findByActiveTrueOrderBySortOrderAscNameAsc()
      .stream()
      .map(CategoryView::from)
      .toList();
  }

  @GetMapping("/api/admin/categories")
  public List<CategoryView> adminList() {
    return categories
      .findAllByOrderBySortOrderAscNameAsc()
      .stream()
      .map(CategoryView::from)
      .toList();
  }

  @PostMapping("/api/admin/categories")
  @ResponseStatus(HttpStatus.CREATED)
  public CategoryView create(@Valid @RequestBody CategoryInput input) {
    return save(new Category(), input);
  }

  @PutMapping("/api/admin/categories/{id}")
  public CategoryView update(
    @PathVariable long id,
    @Valid @RequestBody CategoryInput input
  ) {
    return save(
      categories
        .findById(id)
        .orElseThrow(() -> ApiException.missing("Categoría no encontrada")),
      input
    );
  }

  private CategoryView save(Category c, CategoryInput input) {
    c.name = input.name().strip();
    c.active = input.active();
    c.sortOrder = input.sortOrder();
    return CategoryView.from(categories.saveAndFlush(c));
  }

  @DeleteMapping("/api/admin/categories/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable long id) {
    var c = categories
      .findById(id)
      .orElseThrow(() -> ApiException.missing("Categoría no encontrada"));
    if (products.existsByCategoryId(id)) throw ApiException.invalid(
      "La categoría tiene productos. Desactivala o reasignalos antes de eliminarla."
    );
    categories.delete(c);
  }
}
