package com.catalog.business;

import java.math.BigDecimal;

public record PublicBusiness(
  String name,
  String description,
  String currency,
  String primaryColor,
  String whatsapp,
  BigDecimal minimumOrder,
  String welcomeMessage,
  String terms,
  boolean configured,
  String logo,
  String banner,
  String address,
  String phone,
  String email,
  String instagram,
  String facebook,
  boolean wholesale,
  boolean demo
) {
  public static PublicBusiness from(BusinessSettings settings, boolean demo) {
    return new PublicBusiness(
      settings.getName(),
      settings.getDescription(),
      settings.getCurrency(),
      settings.getPrimaryColor(),
      demo ? "" : settings.getWhatsapp(),
      settings.getMinimumOrder(),
      settings.getWelcomeMessage(),
      settings.getTerms(),
      !settings.getName().isBlank(),
      settings.logo,
      settings.banner,
      settings.address,
      settings.phone,
      settings.email,
      settings.instagram,
      settings.facebook,
      settings.wholesale,
      demo
    );
  }
}
