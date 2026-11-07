package com.catalog.product;

import org.springframework.data.jpa.repository.*;

public interface ProductRepository
  extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product>
{
  boolean existsByCategoryId(Long id);
  long countByActive(boolean active);
  long countByAvailableFalse();
}
