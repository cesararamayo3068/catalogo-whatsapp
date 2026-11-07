package com.catalog.common;

import jakarta.validation.ConstraintViolationException;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiErrors {

  private ResponseEntity<ProblemDetail> error(
    HttpStatus status,
    String message
  ) {
    var body = ProblemDetail.forStatusAndDetail(status, message);
    body.setTitle(status.getReasonPhrase());
    return ResponseEntity.status(status).body(body);
  }

  @ExceptionHandler(ApiException.class)
  ResponseEntity<ProblemDetail> domain(ApiException ex) {
    return error(ex.status, ex.getMessage());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ProblemDetail> validation(MethodArgumentNotValidException ex) {
    var result = error(HttpStatus.BAD_REQUEST, "Revisá los campos indicados.");
    result.getBody().setProperty(
      "fields",
      ex
        .getBindingResult()
        .getFieldErrors()
        .stream()
        .collect(
          Collectors.toMap(
            e -> e.getField(),
            e ->
              e.getDefaultMessage() == null
                ? "Valor inválido"
                : e.getDefaultMessage(),
            (a, b) -> a
          )
        )
    );
    return result;
  }

  @ExceptionHandler({
    IllegalArgumentException.class,
    ConstraintViolationException.class,
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
  })
  ResponseEntity<ProblemDetail> invalid(Exception ex) {
    return error(HttpStatus.BAD_REQUEST, "Los datos enviados no son válidos.");
  }

  @ExceptionHandler({
    DataIntegrityViolationException.class,
    org.springframework.orm.ObjectOptimisticLockingFailureException.class,
  })
  ResponseEntity<ProblemDetail> conflict(Exception ex) {
    return error(
      HttpStatus.CONFLICT,
      "El registro está en uso, fue modificado o tiene un nombre/SKU duplicado. Actualizá los datos."
    );
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  ResponseEntity<ProblemDetail> large(Exception ex) {
    return error(HttpStatus.PAYLOAD_TOO_LARGE, "La imagen supera los 5 MB.");
  }

  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<ProblemDetail> status(ResponseStatusException ex) {
    return error(
      HttpStatus.valueOf(ex.getStatusCode().value()),
      ex.getReason()
    );
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ProblemDetail> unexpected(Exception ex) {
    if (
      ex instanceof org.springframework.web.ErrorResponse response
    ) return error(
      HttpStatus.valueOf(response.getStatusCode().value()),
      "La solicitud no es válida para este recurso."
    );
    LoggerFactory.getLogger(ApiErrors.class).error(
      "Error interno de tipo {}",
      ex.getClass().getSimpleName()
    );
    return error(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "No pudimos completar la operación. Intentá nuevamente."
    );
  }
}
