package com.catalog.product;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.*;

@Entity
public class ProductVariant {

  @Id
  public UUID id = UUID.randomUUID();

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "product_id")
  public Product product;

  @Column(length = 160)
  public String label;

  public String sku;

  @Column(precision = 19, scale = 2)
  public BigDecimal price;

  public boolean available = true;

  @ElementCollection
  @CollectionTable(
    name = "variant_attribute",
    joinColumns = @JoinColumn(name = "variant_id")
  )
  @MapKeyColumn(name = "attribute_name", length = 80)
  @Column(name = "attribute_value", length = 200)
  public Map<String, String> attributes = new LinkedHashMap<>();
}
