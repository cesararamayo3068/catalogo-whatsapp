package com.catalog.business;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record BusinessInput(
  @NotBlank @Size(max = 120) String name,
  @NotNull @Size(max = 1000) String description,
  @NotNull @Pattern(regexp = "[A-Z]{3}") String currency,
  @NotNull @Pattern(regexp = "#[0-9a-fA-F]{6}") String primaryColor,
  @NotNull
  @Pattern(
    regexp = "|[1-9][0-9]{7,14}",
    message = "Usá el código de país y número, solo dígitos (8 a 15)."
  )
  String whatsapp,
  @NotNull
  @DecimalMin("0")
  @Digits(integer = 12, fraction = 2)
  BigDecimal minimumOrder,
  @NotNull @Size(max = 500) String welcomeMessage,
  @NotNull @Size(max = 4000) String terms,
  @NotNull @Size(max = 500) String logo,
  @NotNull @Size(max = 500) String banner,
  @NotNull @Size(max = 300) String address,
  @NotNull @Size(max = 40) String phone,
  @NotNull @Email @Size(max = 254) String email,
  @NotNull @Pattern(regexp = "|https://[^\\s]{1,290}") String instagram,
  @NotNull @Pattern(regexp = "|https://[^\\s]{1,290}") String facebook,
  boolean wholesale
) {}
