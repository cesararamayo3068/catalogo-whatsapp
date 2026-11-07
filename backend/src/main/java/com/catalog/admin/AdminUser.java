package com.catalog.admin;

import jakarta.persistence.*;

@Entity
@Table(name = "admin_user")
public class AdminUser {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String username;
  public String passwordHash;
  public boolean enabled = true;
}
