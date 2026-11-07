package com.catalog.business;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessRepository
  extends JpaRepository<BusinessSettings, Short> {}
