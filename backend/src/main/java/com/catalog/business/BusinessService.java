package com.catalog.business;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class BusinessService {

  private final BusinessRepository repository;

  private final boolean demo;

  public BusinessService(
    BusinessRepository repository,
    @Value("${commerce.demo:false}") boolean demo
  ) {
    this.repository = repository;
    this.demo = demo;
  }

  public PublicBusiness getPublicSettings() {
    return repository
      .findById((short) 1)
      .map(settings -> PublicBusiness.from(settings, demo))
      .orElseThrow(() ->
        new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Configuración no disponible"
        )
      );
  }

  @Transactional
  public PublicBusiness update(BusinessInput input) {
    if (
      !input.logo().isBlank()
    ) com.catalog.product.ProductService.validateImageReference(input.logo());
    if (
      !input.banner().isBlank()
    ) com.catalog.product.ProductService.validateImageReference(input.banner());
    try {
      java.util.Currency.getInstance(input.currency());
    } catch (IllegalArgumentException ex) {
      throw com.catalog.common.ApiException.invalid("La moneda no es válida.");
    }
    var settings = repository
      .findById((short) 1)
      .orElseThrow(() ->
        com.catalog.common.ApiException.missing("Configuración no encontrada")
      );
    settings.apply(input);
    return PublicBusiness.from(repository.saveAndFlush(settings), demo);
  }
}
