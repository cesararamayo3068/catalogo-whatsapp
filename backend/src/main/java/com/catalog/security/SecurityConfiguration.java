package com.catalog.security;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
      .cors(cors -> {})
      .csrf(csrf ->
        csrf
          .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
          .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
      )
      .authorizeHttpRequests(auth ->
        auth
          .requestMatchers(
            HttpMethod.GET,
            "/api/public/**",
            "/api/auth/csrf",
            "/actuator/health"
          )
          .permitAll()
          .requestMatchers(
            HttpMethod.POST,
            "/api/auth/login",
            "/api/auth/logout",
            "/api/public/checkout/prepare"
          )
          .permitAll()
          .requestMatchers("/api/auth/me")
          .hasRole("ADMIN")
          .requestMatchers(
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
          )
          .permitAll()
          .requestMatchers("/api/admin/**")
          .hasRole("ADMIN")
          .anyRequest()
          .denyAll()
      )
      .exceptionHandling(errors ->
        errors.authenticationEntryPoint(
          new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
        )
      )
      .addFilterBefore(
        new LoginRateLimitFilter(),
        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class
      )
      .formLogin(form ->
        form
          .loginProcessingUrl("/api/auth/login")
          .successHandler((request, response, authentication) ->
            response.setStatus(204)
          )
          .failureHandler((request, response, exception) ->
            response.setStatus(401)
          )
      )
      .httpBasic(basic -> basic.disable())
      .logout(logout ->
        logout
          .logoutUrl("/api/auth/logout")
          .deleteCookies("JSESSIONID")
          .logoutSuccessHandler((request, response, authentication) ->
            response.setStatus(204)
          )
      )
      .build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource(
    @Value("${commerce.allowed-origin}") String origin
  ) {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(origin));
    config.setAllowedMethods(
      List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
    );
    config.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source =
      new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  org.springframework.security.core.userdetails.UserDetailsService userDetailsService(
    com.catalog.admin.AdminUserRepository users
  ) {
    return username ->
      users
        .findByUsername(username)
        .map(u ->
          org.springframework.security.core.userdetails.User.withUsername(
            u.username
          )
            .password(u.passwordHash)
            .roles("ADMIN")
            .disabled(!u.enabled)
            .build()
        )
        .orElseThrow(() ->
          new org.springframework.security.core.userdetails.UsernameNotFoundException(
            "Usuario no encontrado"
          )
        );
  }
}
