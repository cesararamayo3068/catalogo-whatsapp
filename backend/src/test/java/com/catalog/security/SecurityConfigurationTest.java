package com.catalog.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.catalog.business.BusinessController;
import com.catalog.business.BusinessService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
  controllers = { BusinessController.class, CsrfController.class },
  properties = "commerce.allowed-origin=http://localhost:14202"
)
@Import(SecurityConfiguration.class)
class SecurityConfigurationTest {

  @Autowired
  MockMvc mvc;

  @MockitoBean
  BusinessService service;

  @MockitoBean
  com.catalog.admin.AdminUserRepository users;

  private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder signedPost(
    String path
  ) throws Exception {
    var response = mvc.perform(get("/api/auth/csrf")).andReturn().getResponse();
    String token = new com.fasterxml.jackson.databind.ObjectMapper()
      .readTree(response.getContentAsString())
      .get("token")
      .asText();
    return post(path)
      .cookie(response.getCookie("XSRF-TOKEN"))
      .header("X-XSRF-TOKEN", token);
  }

  @Test
  void publicBusinessIsAccessible() throws Exception {
    mvc.perform(get("/api/public/business")).andExpect(status().isOk());
  }

  @Test
  void adminRequiresAuthentication() throws Exception {
    mvc
      .perform(get("/api/admin/products"))
      .andExpect(status().isUnauthorized());
  }

  @Test
  void writesRequireCsrf() throws Exception {
    mvc
      .perform(
        post("/api/admin/products")
          .contentType("application/json")
          .content("{}")
      )
      .andExpect(status().isForbidden());
  }

  @Test
  void issuesCsrfCookie() throws Exception {
    mvc
      .perform(get("/api/auth/csrf"))
      .andExpect(status().isOk())
      .andExpect(cookie().exists("XSRF-TOKEN"))
      .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"));
  }

  @Test
  void rejectsOtherOrigins() throws Exception {
    mvc
      .perform(
        options("/api/public/business")
          .header("Origin", "https://untrusted.example")
          .header("Access-Control-Request-Method", "GET")
      )
      .andExpect(status().isForbidden());
  }

  @Test
  void rejectsAuthenticatedNonAdmin() throws Exception {
    mvc
      .perform(
        get("/api/admin/products").with(
          org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(
            "reader"
          ).roles("USER")
        )
      )
      .andExpect(status().isForbidden());
  }

  @Test
  void authenticatesUsingHashedPassword() throws Exception {
    var admin = new com.catalog.admin.AdminUser();
    admin.username = "admin";
    admin.passwordHash =
      new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(
        "a-long-testing-password"
      );
    org.mockito.Mockito.when(users.findByUsername("admin")).thenReturn(
      java.util.Optional.of(admin)
    );
    mvc
      .perform(
        signedPost("/api/auth/login")
          .param("username", "admin")
          .param("password", "a-long-testing-password")
      )
      .andExpect(status().isNoContent())
      .andExpect(
        org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.authenticated().withUsername(
          "admin"
        )
      );
  }

  @Test
  void rejectsBadCredentials() throws Exception {
    mvc
      .perform(
        signedPost("/api/auth/login")
          .param("username", "missing")
          .param("password", "wrong")
      )
      .andExpect(status().isUnauthorized());
  }

  @Test
  void logoutClearsAuthentication() throws Exception {
    mvc
      .perform(
        signedPost("/api/auth/logout").with(
          org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(
            "admin"
          ).roles("ADMIN")
        )
      )
      .andExpect(status().isNoContent())
      .andExpect(
        org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.unauthenticated()
      );
  }
}
