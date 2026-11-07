package com.catalog.storage;

import com.catalog.common.ApiException;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalImageStorage implements ImageStorage {

  private final Path root;

  public LocalImageStorage(
    @Value("${commerce.storage-directory}") String directory
  ) throws IOException {
    root = Path.of(directory).toAbsolutePath().normalize();
    Files.createDirectories(root);
  }

  public String store(MultipartFile file) throws IOException {
    if (
      file.isEmpty() || file.getSize() > 5 * 1024 * 1024
    ) throw ApiException.invalid("Elegí una imagen PNG o JPG de hasta 5 MB.");
    String name = Optional.ofNullable(file.getOriginalFilename())
      .orElse("")
      .toLowerCase(Locale.ROOT);
    if (
      !(
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg")
      ) ||
      !List.of("image/png", "image/jpeg").contains(file.getContentType())
    ) throw ApiException.invalid("Solo se admiten imágenes PNG o JPG.");
    try (var stream = ImageIO.createImageInputStream(file.getInputStream())) {
      var readers = ImageIO.getImageReaders(stream);
      if (!readers.hasNext()) throw ApiException.invalid(
        "El archivo no contiene una imagen válida."
      );
      var reader = readers.next();
      try {
        reader.setInput(stream, true, true);
        if (
          !List.of("png", "jpeg", "jpg").contains(
            reader.getFormatName().toLowerCase(Locale.ROOT)
          )
        ) throw ApiException.invalid(
          "El formato real de la imagen no está permitido."
        );
        int width = reader.getWidth(0),
          height = reader.getHeight(0);
        if (
          width > 4096 || height > 4096 || (long) width * height > 16000000
        ) throw ApiException.invalid(
          "La imagen debe medir hasta 4096 px por lado y 16 megapíxeles."
        );
        var decoded = reader.read(0);
        String stored = UUID.randomUUID() + ".png";
        // Re-encode to drop metadata and embedded payloads. Never use the supplied filename.
        ImageIO.write(decoded, "png", root.resolve(stored).toFile());
        return "/api/public/images/" + stored;
      } finally {
        reader.dispose();
      }
    } catch (javax.imageio.IIOException ex) {
      throw ApiException.invalid("La imagen está dañada.");
    }
  }

  public Resource load(String name) throws IOException {
    if (!name.matches("[a-f0-9-]{36}\\.png")) throw ApiException.missing(
      "Imagen no encontrada"
    );
    Path file = root.resolve(name).normalize();
    if (
      !file.startsWith(root) || !Files.isRegularFile(file)
    ) throw ApiException.missing("Imagen no encontrada");
    return new FileSystemResource(file);
  }
}
