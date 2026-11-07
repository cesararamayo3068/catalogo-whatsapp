package com.catalog.order;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.catalog.business.*;
import com.catalog.common.ApiException;
import com.catalog.product.*;
import java.math.BigDecimal;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.junit.jupiter.api.*;

class CheckoutServiceTest {

  ProductService products;
  BusinessService business;
  PublicBusiness settings;
  CheckoutService checkout;
  Product product;

  @BeforeEach
  void setup() {
    products = mock(ProductService.class);
    business = mock(BusinessService.class);
    settings = mock(PublicBusiness.class);
    when(business.getPublicSettings()).thenReturn(settings);
    when(settings.whatsapp()).thenReturn("5491100000000");
    when(settings.currency()).thenReturn("ARS");
    when(settings.minimumOrder()).thenReturn(BigDecimal.ZERO);
    product = new Product();
    product.id = 1L;
    product.name = "Taza & café";
    product.sku = "TAZ-1";
    product.price = new BigDecimal("0.10");
    product.minimumQuantity = 1;
    when(products.require(1L, false)).thenReturn(product);
    checkout = new CheckoutService(products, business);
  }

  CheckoutService.Input input(int quantity, UUID variant) {
    return new CheckoutService.Input(
      "Cliente de prueba",
      "",
      "Córdoba",
      "Sin azúcar & gracias",
      List.of(new CheckoutService.LineInput(1, variant, quantity))
    );
  }

  @Test
  void calculatesExactlyAndEncodesWhatsappMessage() {
    var result = checkout.prepare(input(3, null));
    assertEquals(new BigDecimal("0.30"), result.total());
    assertTrue(
      result.whatsappUrl().startsWith("https://wa.me/5491100000000?text=")
    );
    assertEquals(
      result.message(),
      URLDecoder.decode(
        result.whatsappUrl().split("text=", 2)[1],
        StandardCharsets.UTF_8
      )
    );
    assertTrue(result.message().contains("Cliente: Cliente de prueba"));
    assertTrue(result.message().contains("TOTAL GENERAL: ARS 0.30"));
  }

  @Test
  void preparesDemoOrderWithoutWhatsappDestination() {
    when(settings.demo()).thenReturn(true);
    when(settings.whatsapp()).thenReturn("");

    var result = checkout.prepare(input(3, null));

    assertEquals(new BigDecimal("0.30"), result.total());
    assertTrue(result.message().contains("TOTAL GENERAL: ARS 0.30"));
    assertEquals("", result.whatsappUrl());
  }

  @Test
  void usesCurrentServerPromotion() {
    product.price = new BigDecimal("200.00");
    product.promotionalPrice = new BigDecimal("150.00");
    assertEquals(
      new BigDecimal("300.00"),
      checkout.prepare(input(2, null)).total()
    );
  }

  @Test
  void variantPriceOverridesBasePrice() {
    var v = new ProductVariant();
    v.label = "XL / Azul";
    v.price = new BigDecimal("12.35");
    v.sku = "AZ-XL";
    product.variants.add(v);
    var order = checkout.prepare(input(2, v.id));
    assertEquals(new BigDecimal("24.70"), order.total());
    assertTrue(order.message().contains("Variante: XL / Azul"));
    assertTrue(order.message().contains("SKU: AZ-XL"));
  }

  @Test
  void rejectsInvalidAndMissingVariant() {
    var v = new ProductVariant();
    product.variants.add(v);
    assertThrows(ApiException.class, () -> checkout.prepare(input(1, null)));
    assertThrows(ApiException.class, () ->
      checkout.prepare(input(1, UUID.randomUUID()))
    );
  }

  @Test
  void rejectsUnavailableVariant() {
    var v = new ProductVariant();
    v.available = false;
    product.variants.add(v);
    assertThrows(ApiException.class, () -> checkout.prepare(input(1, v.id)));
  }

  @Test
  void rejectsUnavailableProduct() {
    product.available = false;
    assertThrows(ApiException.class, () -> checkout.prepare(input(1, null)));
  }

  @Test
  void enforcesMinimumQuantity() {
    product.minimumQuantity = 4;
    assertThrows(ApiException.class, () -> checkout.prepare(input(3, null)));
  }

  @Test
  void enforcesMinimumOrder() {
    when(settings.minimumOrder()).thenReturn(new BigDecimal("100"));
    assertThrows(ApiException.class, () -> checkout.prepare(input(1, null)));
  }

  @Test
  void rejectsUnconfiguredWhatsapp() {
    when(settings.whatsapp()).thenReturn("");
    assertThrows(ApiException.class, () -> checkout.prepare(input(1, null)));
  }

  @Test
  void rejectsDuplicateLines() {
    var line = new CheckoutService.LineInput(1, null, 1);
    assertThrows(ApiException.class, () ->
      checkout.prepare(
        new CheckoutService.Input(
          "Cliente",
          "",
          "Localidad",
          "",
          List.of(line, line)
        )
      )
    );
  }

  @Test
  void validatesInputConstraints() {
    try (
      var factory = jakarta.validation.Validation.buildDefaultValidatorFactory()
    ) {
      assertFalse(factory.getValidator().validate(input(0, null)).isEmpty());
    }
  }
}
