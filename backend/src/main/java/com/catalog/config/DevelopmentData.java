package com.catalog.config;

import com.catalog.business.*;
import com.catalog.category.*;
import com.catalog.product.*;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.boot.*;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("development")
public class DevelopmentData implements ApplicationRunner {

  private final ProductRepository products;
  private final CategoryRepository categories;
  private final BusinessRepository business;

  public DevelopmentData(
    ProductRepository products,
    CategoryRepository categories,
    BusinessRepository business
  ) {
    this.products = products;
    this.categories = categories;
    this.business = business;
  }

  @Transactional
  public void run(ApplicationArguments args) {
    // Seed only a pristine installation; never repopulate a merchant's emptied catalog.
    var settings = business.findById((short) 1).orElseThrow();
    if (
      !settings.getName().isBlank() ||
      products.count() != 0 ||
      categories.count() != 0
    ) return;
    settings.apply(
      new BusinessInput(
        "Tienda de ejemplo",
        "Una selección para tu casa, tu trabajo y tus momentos. Elegí lo que te gusta y consultanos por WhatsApp.",
        "ARS",
        "#176b52",
        "",
        BigDecimal.ZERO,
        "Buenas cosas para tu día a día.",
        "Catálogo de desarrollo con productos e ilustraciones de ejemplo. Disponibilidad, pago y entrega se confirman con el comercio.",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        false
      )
    );
    business.save(settings);
    String[] names = {
      "Hogar y bazar",
      "Indumentaria",
      "Tecnología",
      "Herramientas",
      "Librería",
    };
    List<Category> cats = new ArrayList<>();
    int order = 0;
    for (String name : names) {
      var c = new Category();
      c.name = name;
      c.sortOrder = order++;
      cats.add(categories.save(c));
    }
    seed(
      "BOT-001",
      "Botella térmica",
      "Acero inoxidable, doble pared y tapa hermética. Capacidad de 750 ml. Ilustración de referencia.",
      cats.get(0),
      "18500",
      "15900",
      "bottle",
      Map.of("Capacidad", "750 ml", "Material", "Acero inoxidable"),
      List.of("Verde bosque", "Arena"),
      true,
      true
    );
    seed(
      "REM-001",
      "Remera de algodón",
      "Corte clásico y tejido suave para todos los días. Elegí talle y color. Ilustración de referencia.",
      cats.get(1),
      "12900",
      null,
      "shirt",
      Map.of("Composición", "100% algodón"),
      List.of("S / Crudo", "M / Crudo", "L / Crudo", "M / Verde"),
      true,
      true
    );
    seed(
      "AUR-001",
      "Auriculares inalámbricos",
      "Estuche de carga compacto, conexión Bluetooth y micrófono integrado. Ilustración de referencia.",
      cats.get(2),
      "34900",
      "29900",
      "headphones",
      Map.of("Conectividad", "Bluetooth", "Color", "Grafito"),
      List.of(),
      true,
      true
    );
    seed(
      "TAZ-001",
      "Taza de cerámica",
      "Terminación mate y capacidad de 350 ml. Una pausa, a tu manera. Ilustración de referencia.",
      cats.get(0),
      "7900",
      null,
      "mug",
      Map.of("Capacidad", "350 ml"),
      List.of("Terracota", "Crema"),
      true,
      true
    );
    seed(
      "HER-001",
      "Kit de herramientas",
      "Juego de destornilladores y puntas para las reparaciones de todos los días. Ilustración de referencia.",
      cats.get(3),
      "24900",
      null,
      "tools",
      Map.of("Presentación", "Kit de 12 piezas"),
      List.of(),
      false,
      true
    );
    seed(
      "LIB-001",
      "Cuaderno de tapa dura",
      "96 hojas para ideas, planes y proyectos. Formato A5. Ilustración de referencia.",
      cats.get(4),
      "6500",
      null,
      "notebook",
      Map.of("Formato", "A5", "Hojas", "96"),
      List.of("Liso", "Rayado"),
      true,
      true
    );
    seed(
      "LAMP-001",
      "Lámpara de escritorio",
      "Luz cálida, diseño compacto y terminación mate. Ilustración de referencia.",
      cats.get(0),
      "28500",
      null,
      "lamp",
      Map.of("Alimentación", "220 V"),
      List.of(),
      false,
      false
    );
    seed(
      "BOL-001",
      "Bolsa de tela",
      "Reutilizable, liviana y resistente. Para acompañarte en cada compra. Ilustración de referencia.",
      cats.get(1),
      "4900",
      null,
      "bag",
      Map.of("Material", "Lienzo"),
      List.of(),
      false,
      true
    );
  }

  private void seed(
    String sku,
    String name,
    String description,
    Category category,
    String price,
    String promo,
    String image,
    Map<String, String> attrs,
    List<String> variants,
    boolean featured,
    boolean available
  ) {
    var p = new Product();
    p.sku = sku;
    p.name = name;
    p.description = description;
    p.category = category;
    p.price = new BigDecimal(price);
    p.promotionalPrice = promo == null ? null : new BigDecimal(promo);
    p.featured = featured;
    p.available = available;
    p.images.add("/assets/products/" + image + ".svg");
    p.attributes.putAll(attrs);
    for (String label : variants) {
      var v = new ProductVariant();
      v.label = label;
      v.product = p;
      v.attributes.put("Opción", label);
      p.variants.add(v);
    }
    products.save(p);
  }
}
