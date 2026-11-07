package com.catalog.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public final class ProductDtos {

  private ProductDtos() {}

  public record VariantInput(
    UUID id,
    @NotBlank @Size(max = 160) String label,
    @Size(max = 100) String sku,
    @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal price,
    boolean available,
    @NotNull
    @Size(max = 20)
    Map<
      @NotBlank @Size(max = 80) String,
      @NotBlank @Size(max = 200) String
    > attributes
  ) {}

  public record Input(
    @Size(max = 100) String sku,
    @NotBlank @Size(max = 180) String name,
    @NotNull @Size(max = 6000) String description,
    @NotNull @Positive Long categoryId,
    @NotNull
    @DecimalMin("0")
    @Digits(integer = 12, fraction = 2)
    BigDecimal price,
    @DecimalMin("0")
    @Digits(integer = 12, fraction = 2)
    BigDecimal promotionalPrice,
    boolean active,
    boolean available,
    boolean featured,
    @Min(1) @Max(9999) int minimumQuantity,
    @NotNull @Size(max = 8) List<@NotBlank @Size(max = 500) String> images,
    @NotNull
    @Size(max = 30)
    Map<
      @NotBlank @Size(max = 80) String,
      @NotBlank @Size(max = 200) String
    > attributes,
    @NotNull @Size(max = 100) List<@NotNull @Valid VariantInput> variants,
    @PositiveOrZero Long version
  ) {}

  public record VariantView(
    UUID id,
    String label,
    String sku,
    BigDecimal price,
    boolean available,
    Map<String, String> attributes
  ) {}

  public record View(
    Long id,
    String sku,
    String name,
    String description,
    Long categoryId,
    String categoryName,
    BigDecimal price,
    BigDecimal promotionalPrice,
    boolean active,
    boolean available,
    boolean featured,
    int minimumQuantity,
    List<String> images,
    Map<String, String> attributes,
    List<VariantView> variants,
    Instant createdAt,
    Instant updatedAt,
    long version
  ) {
    public static View from(Product p) {
      return new View(
        p.id,
        p.sku,
        p.name,
        p.description,
        p.category.getId(),
        p.category.getName(),
        p.price,
        p.promotionalPrice,
        p.active,
        p.available,
        p.featured,
        p.minimumQuantity,
        List.copyOf(p.images),
        Map.copyOf(p.attributes),
        p.variants
          .stream()
          .map(v ->
            new VariantView(
              v.id,
              v.label,
              v.sku,
              v.price,
              v.available,
              Map.copyOf(v.attributes)
            )
          )
          .toList(),
        p.createdAt,
        p.updatedAt,
        p.version
      );
    }
  }

  public record PageView(
    List<View> items,
    int page,
    int totalPages,
    long totalElements
  ) {}
}
