package com.catalog.order;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
public class CheckoutController {

  private final CheckoutService checkout;

  public CheckoutController(CheckoutService checkout) {
    this.checkout = checkout;
  }

  @PostMapping("/api/public/checkout/prepare")
  public CheckoutService.Prepared prepare(
    @Valid @RequestBody CheckoutService.Input input
  ) {
    return checkout.prepare(input);
  }
}
