package com.catalog.business;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class BusinessService {

  private final BusinessRepository repository;

  public BusinessService(BusinessRepository repository) {
    this.repository = repository;
  }

  public PublicBusiness getPublicSettings() {
    return repository
      .findById((short) 1)
      .map(PublicBusiness::from)
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
    return PublicBusiness.from(repository.saveAndFlush(settings));
  }
}
