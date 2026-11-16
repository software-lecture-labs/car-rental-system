package com.rentacar.rentalsystem.car;

import java.util.UUID;

/**
 * Görselin dosya içeriği (data) olmadan bilgileri. Listelemede megabaytlarca veriyi boşuna çekmemek için.
 */
public interface CarImageSummary {

    UUID getId();

    String getContentType();

    int getSizeBytes();

    int getSortOrder();
}
