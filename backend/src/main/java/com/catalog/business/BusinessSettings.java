package com.catalog.business;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "business_settings")
public class BusinessSettings {

  @Id
  private Short id;

  private String name;
  private String description;

  @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.CHAR)
  @Column(columnDefinition = "char(3)", length = 3)
  private String currency;

  private String primaryColor;
  private String whatsapp;
  private BigDecimal minimumOrder;
  private String welcomeMessage;
  private String terms;
  private Instant updatedAt;
  public String logo = "",
    banner = "",
    address = "",
    phone = "",
    email = "",
    instagram = "",
    facebook = "";
  public boolean wholesale;

  protected BusinessSettings() {}

  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public String getCurrency() {
    return currency;
  }

  public String getPrimaryColor() {
    return primaryColor;
  }

  public String getWhatsapp() {
    return whatsapp;
  }

  public BigDecimal getMinimumOrder() {
    return minimumOrder;
  }

  public String getWelcomeMessage() {
    return welcomeMessage;
  }

  public String getTerms() {
    return terms;
  }

  public void apply(BusinessInput in) {
    name = in.name().strip();
    description = in.description();
    currency = in.currency();
    primaryColor = in.primaryColor();
    whatsapp = in.whatsapp();
    minimumOrder = in.minimumOrder();
    welcomeMessage = in.welcomeMessage();
    terms = in.terms();
    logo = in.logo();
    banner = in.banner();
    address = in.address();
    phone = in.phone();
    email = in.email();
    instagram = in.instagram();
    facebook = in.facebook();
    wholesale = in.wholesale();
    updatedAt = Instant.now();
  }
}
