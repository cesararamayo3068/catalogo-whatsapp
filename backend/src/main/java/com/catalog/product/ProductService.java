package com.catalog.product;

import static com.catalog.product.ProductDtos.*;

import com.catalog.category.CategoryRepository;
import com.catalog.common.ApiException;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProductService {

  private final ProductRepository products;
  private final CategoryRepository categories;

  public ProductService(
    ProductRepository products,
    CategoryRepository categories
  ) {
    this.products = products;
    this.categories = categories;
  }

  @Transactional(readOnly = true)
  public PageView list(
    boolean admin,
    String query,
    Long category,
    Boolean featured,
    Boolean available,
    String sort,
    int page,
    int size
  ) {
    if (query != null && query.length() > 100) throw ApiException.invalid(
      "La búsqueda admite hasta 100 caracteres."
    );
    boolean priceSort = List.of("price-asc", "price-desc").contains(sort);
    String field = switch (sort) {
      case "price-asc", "price-desc" -> "price";
      case "name" -> "name";
      default -> "createdAt";
    };
    var direction = List.of("price-asc", "name").contains(sort)
      ? Sort.Direction.ASC
      : Sort.Direction.DESC;
    Specification<Product> spec = (root, q, cb) -> {
      List<Predicate> where = new ArrayList<>();
      if (!admin) {
        where.add(cb.isTrue(root.get("active")));
        where.add(cb.isTrue(root.get("category").get("active")));
      }
      if (query != null && !query.isBlank()) {
        String escaped = query
          .strip()
          .toLowerCase(Locale.ROOT)
          .replace("\\", "\\\\")
          .replace("%", "\\%")
          .replace("_", "\\_");
        String term = "%" + escaped + "%";
        where.add(
          cb.or(
            cb.like(cb.lower(root.get("name")), term, '\\'),
            cb.like(cb.lower(root.get("sku")), term, '\\')
          )
        );
      }
      if (category != null) where.add(
        cb.equal(root.get("category").get("id"), category)
      );
      if (Boolean.TRUE.equals(featured)) where.add(
        cb.isTrue(root.get("featured"))
      );
      if (Boolean.TRUE.equals(available)) where.add(
        cb.isTrue(root.get("available"))
      );
      if (
        priceSort &&
        q != null &&
        q.getResultType() != Long.class &&
        q.getResultType() != long.class
      ) {
        var amount = cb.coalesce(
          root.<BigDecimal>get("promotionalPrice"),
          root.<BigDecimal>get("price")
        );
        q.orderBy(
          direction == Sort.Direction.ASC ? cb.asc(amount) : cb.desc(amount),
          cb.asc(root.get("id"))
        );
      }
      return cb.and(where.toArray(Predicate[]::new));
    };
    var result = products.findAll(
      spec,
      PageRequest.of(
        Math.max(0, page),
        Math.clamp(size, 1, 100),
        priceSort
          ? Sort.unsorted()
          : Sort.by(direction, field).and(Sort.by("id"))
      )
    );
    return new PageView(
      result.map(View::from).getContent(),
      result.getNumber(),
      result.getTotalPages(),
      result.getTotalElements()
    );
  }

  @Transactional(readOnly = true)
  public Product require(long id, boolean admin) {
    var p = products
      .findById(id)
      .orElseThrow(() -> ApiException.missing("Producto no encontrado"));
    if (
      !admin && (!p.active || !p.category.isActive())
    ) throw ApiException.missing("Producto no encontrado");
    return p;
  }

  @Transactional(readOnly = true)
  public View detail(long id, boolean admin) {
    return View.from(require(id, admin));
  }

  public View save(Long id, Input input) {
    var p = id == null ? new Product() : require(id, true);
    if (
      id != null && (input.version() == null || p.version != input.version())
    ) throw new ApiException(
      HttpStatus.CONFLICT,
      "El producto cambió. Actualizá la página antes de guardar."
    );
    if (
      input.promotionalPrice() != null &&
      input.promotionalPrice().compareTo(input.price()) >= 0
    ) throw ApiException.invalid(
      "El precio promocional debe ser menor al precio habitual."
    );
    var category = categories
      .findById(input.categoryId())
      .orElseThrow(() -> ApiException.invalid("Elegí una categoría válida."));
    input.images().forEach(ProductService::validateImageReference);
    if (
      input
        .variants()
        .stream()
        .map(v -> v.label().strip().toLowerCase(Locale.ROOT))
        .distinct()
        .count() != input.variants().size()
    ) throw ApiException.invalid(
      "Las variantes deben tener nombres diferentes."
    );
    p.sku = blankToNull(input.sku());
    p.name = input.name().strip();
    p.description = input.description().strip();
    p.category = category;
    p.price = input.price();
    p.promotionalPrice = input.promotionalPrice();
    p.active = input.active();
    p.available = input.available();
    p.featured = input.featured();
    p.minimumQuantity = input.minimumQuantity();
    p.images.clear();
    p.images.addAll(input.images());
    p.attributes.clear();
    p.attributes.putAll(input.attributes());
    var existing = new HashMap<UUID, ProductVariant>();
    p.variants.forEach(v -> existing.put(v.id, v));
    Set<UUID> requested = new HashSet<>();
    for (var v : input.variants()) {
      if (
        v.id() != null &&
        (!existing.containsKey(v.id()) || !requested.add(v.id()))
      ) throw ApiException.invalid(
        "La variante no pertenece al producto o está repetida."
      );
    }
    p.variants.removeIf(v -> !requested.contains(v.id));
    for (var v : input.variants()) {
      ProductVariant variant =
        v.id() == null ? new ProductVariant() : existing.get(v.id());
      variant.product = p;
      variant.label = v.label().strip();
      variant.sku = blankToNull(v.sku());
      variant.price = v.price();
      variant.available = v.available();
      variant.attributes.clear();
      variant.attributes.putAll(v.attributes());
      if (v.id() == null) p.variants.add(variant);
    }
    // Touch parent even when only an element collection changed, so optimistic locking covers edits.
    p.updatedAt = java.time.Instant.now();
    return View.from(products.saveAndFlush(p));
  }

  public void delete(long id) {
    products.delete(require(id, true));
  }

  public static void validateImageReference(String url) {
    if (
      !url.matches("/api/public/images/[a-f0-9-]+\\.(png|jpg)") &&
      !url.matches("/assets/products/[a-z-]+\\.svg")
    ) throw ApiException.invalid(
      "Usá imágenes cargadas desde el administrador."
    );
  }

  private static String blankToNull(String s) {
    return s == null || s.isBlank() ? null : s.strip();
  }
}
