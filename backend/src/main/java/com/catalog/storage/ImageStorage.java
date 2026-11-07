package com.catalog.storage;

import java.io.IOException;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface ImageStorage {
  String store(MultipartFile file) throws IOException;
  Resource load(String name) throws IOException;
}
