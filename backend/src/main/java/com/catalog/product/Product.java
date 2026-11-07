package com.catalog.product;

import com.catalog.category.Category;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity
public class Product {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String sku;

  @Column(length = 180)
  public String name;

  @Column(length = 6000)
  public String description;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "category_id")
  public Category category;

  @Column(precision = 19, scale = 2)
  public BigDecimal price;

  @Column(precision = 19, scale = 2)
  public BigDecimal promotionalPrice;

  public boolean active = true;
  public boolean available = true;
  public boolean featured;
  public int minimumQuantity = 1;
  public Instant createdAt;
  public Instant updatedAt;

  @Version
  public long version;

  @ElementCollection
  @CollectionTable(
    name = "product_image",
    joinColumns = @JoinColumn(name = "product_id")
  )
  @OrderColumn(name = "position")
  @Column(name = "url", length = 500)
  public List<String> images = new ArrayList<>();

  @ElementCollection
  @CollectionTable(
    name = "product_attribute",
    joinColumns = @JoinColumn(name = "product_id")
  )
  @MapKeyColumn(name = "attribute_name", length = 80)
  @Column(name = "attribute_value", length = 200)
  public Map<String, String> attributes = new LinkedHashMap<>();

  @OneToMany(
    mappedBy = "product",
    cascade = CascadeType.ALL,
    orphanRemoval = true
  )
  @OrderBy("label ASC")
  public List<ProductVariant> variants = new ArrayList<>();

  @PrePersist
  void create() {
    createdAt = updatedAt = Instant.now();
  }

  @PreUpdate
  void update() {
    updatedAt = Instant.now();
  }

  public BigDecimal effectivePrice() {
    return promotionalPrice != null ? promotionalPrice : price;
  }
}
