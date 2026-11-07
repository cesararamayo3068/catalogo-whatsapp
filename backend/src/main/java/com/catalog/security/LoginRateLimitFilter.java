package com.catalog.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.filter.OncePerRequestFilter;

public class LoginRateLimitFilter extends OncePerRequestFilter {

  private record Window(long start, int count) {}

  private final ConcurrentHashMap<String, Window> attempts =
    new ConcurrentHashMap<>();

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain chain
  ) throws ServletException, IOException {
    if (
      request.getMethod().equals("POST") &&
      request.getServletPath().equals("/api/auth/login")
    ) {
      long now = System.currentTimeMillis();
      if (attempts.size() > 10000) attempts
        .entrySet()
        .removeIf(e -> now - e.getValue().start() > 600000);
      if (
        attempts.size() > 10000 &&
        !attempts.containsKey(request.getRemoteAddr())
      ) {
        response.sendError(429);
        return;
      }
      var window = attempts.compute(request.getRemoteAddr(), (ip, w) ->
        w == null || now - w.start() > 600000
          ? new Window(now, 1)
          : new Window(w.start(), w.count() + 1)
      );
      if (window.count() > 15) {
        response.setHeader("Retry-After", "600");
        response.sendError(429);
        return;
      }
    }
    chain.doFilter(request, response);
  }
}
