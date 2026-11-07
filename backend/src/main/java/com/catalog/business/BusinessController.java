package com.catalog.business;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BusinessController {

  private final BusinessService service;

  public BusinessController(BusinessService service) {
    this.service = service;
  }

  @GetMapping("/api/public/business")
  public PublicBusiness business() {
    return service.getPublicSettings();
  }

  @GetMapping("/api/admin/business")
  public PublicBusiness adminBusiness() {
    return service.getPublicSettings();
  }

  @org.springframework.web.bind.annotation.PutMapping("/api/admin/business")
  public PublicBusiness update(
    @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody BusinessInput input
  ) {
    return service.update(input);
  }
}
