package com.catalog.admin;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements ApplicationRunner {

  private final AdminUserRepository users;
  private final PasswordEncoder encoder;
  private final String username, password;

  public AdminBootstrap(
    AdminUserRepository users,
    PasswordEncoder encoder,
    @Value("${ADMIN_USERNAME:}") String username,
    @Value("${ADMIN_PASSWORD:}") String password
  ) {
    this.users = users;
    this.encoder = encoder;
    this.username = username;
    this.password = password;
  }

  public void run(ApplicationArguments args) {
    if (users.count() != 0 || username.isBlank() || password.isBlank()) return;
    if (
      !username.matches("[a-zA-Z0-9._-]{3,100}") ||
      password.length() < 16 ||
      password.length() > 72
    ) throw new IllegalStateException(
      "El administrador inicial requiere usuario válido y contraseña de 16 a 72 caracteres."
    );
    var user = new AdminUser();
    user.username = username;
    user.passwordHash = encoder.encode(password);
    users.save(user);
  }
}
