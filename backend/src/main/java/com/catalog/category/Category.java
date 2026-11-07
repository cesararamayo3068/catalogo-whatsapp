package com.catalog.category;

import jakarta.persistence.*;

@Entity
public class Category {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(length = 100, nullable = false)
  public String name;

  public boolean active = true;
  public int sortOrder;

  public Category() {}

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public boolean isActive() {
    return active;
  }
}
