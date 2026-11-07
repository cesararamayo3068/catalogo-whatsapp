package com.catalog.storage;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class ImageController {

  private final ImageStorage images;

  public ImageController(ImageStorage images) {
    this.images = images;
  }

  @PostMapping("/api/admin/images")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, String> upload(@RequestParam MultipartFile file)
    throws IOException {
    return Map.of("url", images.store(file));
  }

  @GetMapping("/api/public/images/{name}")
  public ResponseEntity<Resource> image(@PathVariable String name)
    throws IOException {
    return ResponseEntity.ok()
      .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS))
      .contentType(MediaType.IMAGE_PNG)
      .body(images.load(name));
  }
}
