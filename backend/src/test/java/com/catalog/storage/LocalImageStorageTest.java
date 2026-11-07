package com.catalog.storage;

import static org.junit.jupiter.api.Assertions.*;

import com.catalog.common.ApiException;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class LocalImageStorageTest {

  @TempDir
  Path directory;

  @Test
  void storesRealPngWithGeneratedName() throws Exception {
    var data = new ByteArrayOutputStream();
    ImageIO.write(
      new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB),
      "png",
      data
    );
    var storage = new LocalImageStorage(directory.toString());
    String url = storage.store(
      new MockMultipartFile(
        "file",
        "../../image.png",
        "image/png",
        data.toByteArray()
      )
    );
    assertTrue(url.matches("/api/public/images/[a-f0-9-]{36}\\.png"));
    assertTrue(storage.load(url.substring(url.lastIndexOf('/') + 1)).exists());
  }

  @Test
  void rejectsDisguisedPayload() throws Exception {
    var storage = new LocalImageStorage(directory.toString());
    assertThrows(ApiException.class, () ->
      storage.store(
        new MockMultipartFile(
          "file",
          "fake.png",
          "image/png",
          "<script>bad</script>".getBytes()
        )
      )
    );
  }

  @Test
  void rejectsSvgAndPathTraversal() throws Exception {
    var storage = new LocalImageStorage(directory.toString());
    assertThrows(ApiException.class, () ->
      storage.store(
        new MockMultipartFile(
          "file",
          "test.svg",
          "image/svg+xml",
          "<svg/>".getBytes()
        )
      )
    );
    assertThrows(ApiException.class, () -> storage.load("../../secret"));
  }
}
