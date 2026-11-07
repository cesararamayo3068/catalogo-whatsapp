package com.catalog.order;

import com.catalog.business.BusinessService;
import com.catalog.common.ApiException;
import com.catalog.product.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CheckoutService {

  public record LineInput(
    @Positive long productId,
    UUID variantId,
    @Min(1) @Max(9999) int quantity
  ) {}

  public record Input(
    @NotBlank @Size(max = 120) String customerName,
    @NotNull @Size(max = 40) String phone,
    @NotBlank @Size(max = 150) String locality,
    @NotNull @Size(max = 1000) String notes,
    @NotEmpty @Size(max = 50) List<@NotNull @Valid LineInput> items
  ) {}

  public record Line(
    long productId,
    UUID variantId,
    String name,
    String sku,
    String variant,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal subtotal
  ) {}

  public record Prepared(
    List<Line> items,
    BigDecimal total,
    String currency,
    String message,
    String whatsappUrl
  ) {}

  private final ProductService products;
  private final BusinessService business;

  public CheckoutService(ProductService products, BusinessService business) {
    this.products = products;
    this.business = business;
  }

  public Prepared prepare(Input input) {
    var settings = business.getPublicSettings();
    if (
      !settings.whatsapp().matches("[1-9][0-9]{7,14}")
    ) throw ApiException.invalid(
      "El comercio todavía no configuró su WhatsApp. Contactalo por los datos del pie de página."
    );
    List<Line> lines = new ArrayList<>();
    Set<String> keys = new HashSet<>();
    BigDecimal total = BigDecimal.ZERO;
    for (var item : input.items()) {
      if (
        !keys.add(item.productId() + ":" + item.variantId())
      ) throw ApiException.invalid(
        "Hay productos repetidos. Actualizá el carrito."
      );
      var p = products.require(item.productId(), false);
      if (!p.available) throw ApiException.invalid(
        p.name + " ya no está disponible."
      );
      if (item.quantity() < p.minimumQuantity) throw ApiException.invalid(
        p.name + ": cantidad mínima " + p.minimumQuantity + "."
      );
      if (
        item.quantity() > 9999 || item.quantity() < 1
      ) throw ApiException.invalid("Cantidad inválida.");
      ProductVariant variant = null;
      if (!p.variants.isEmpty()) {
        variant = p.variants
          .stream()
          .filter(v -> v.id.equals(item.variantId()))
          .findFirst()
          .orElseThrow(() ->
            ApiException.invalid(
              "Elegí una variante válida para " + p.name + "."
            )
          );
        if (!variant.available) throw ApiException.invalid(
          "La variante elegida de " + p.name + " no está disponible."
        );
      } else if (item.variantId() != null) throw ApiException.invalid(
        "Este producto no tiene variantes."
      );
      BigDecimal price = (
        variant != null && variant.price != null
          ? variant.price
          : p.effectivePrice()
      ).setScale(2, RoundingMode.UNNECESSARY);
      BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.quantity()));
      total = total.add(subtotal);
      lines.add(
        new Line(
          p.id,
          variant == null ? null : variant.id,
          p.name,
          variant != null && variant.sku != null ? variant.sku : p.sku,
          variant == null ? "" : variant.label,
          item.quantity(),
          price,
          subtotal
        )
      );
    }
    total = total.setScale(2, RoundingMode.UNNECESSARY);
    if (
      total.compareTo(settings.minimumOrder()) < 0
    ) throw ApiException.invalid(
      "El pedido mínimo es " +
        money(settings.minimumOrder(), settings.currency()) +
        "."
    );
    var text = new StringBuilder(
      "Hola, quiero realizar el siguiente pedido.\n\nCliente: "
    )
      .append(clean(input.customerName()))
      .append("\nLocalidad: ")
      .append(clean(input.locality()));
    if (!input.phone().isBlank()) text
      .append("\nTeléfono: ")
      .append(clean(input.phone()));
    text.append("\n\nDETALLE DEL PEDIDO\n");
    int index = 1;
    for (var line : lines) {
      text
        .append("\n")
        .append(index++)
        .append(". ")
        .append(line.name())
        .append("\n");
      if (line.sku() != null) text
        .append("SKU: ")
        .append(line.sku())
        .append("\n");
      if (!line.variant().isBlank()) text
        .append("Variante: ")
        .append(line.variant())
        .append("\n");
      text
        .append("Cantidad: ")
        .append(line.quantity())
        .append("\nPrecio unitario: ")
        .append(money(line.unitPrice(), settings.currency()))
        .append("\nSubtotal: ")
        .append(money(line.subtotal(), settings.currency()))
        .append("\n");
    }
    text
      .append("\nTOTAL GENERAL: ")
      .append(money(total, settings.currency()))
      .append("\n\nObservaciones: ")
      .append(clean(input.notes()))
      .append(
        "\n\nQuedo a la espera de la confirmación de disponibilidad, medios de pago y entrega."
      );
    String message = text.toString();
    return new Prepared(
      List.copyOf(lines),
      total,
      settings.currency(),
      message,
      "https://wa.me/" +
        settings.whatsapp() +
        "?text=" +
        URLEncoder.encode(message, StandardCharsets.UTF_8).replace("+", "%20")
    );
  }

  private String clean(String value) {
    return value.replaceAll("[\\p{Cntrl}]", " ").strip();
  }

  private String money(BigDecimal value, String currency) {
    return (
      currency +
      " " +
      value.setScale(2, RoundingMode.UNNECESSARY).toPlainString()
    );
  }
}
