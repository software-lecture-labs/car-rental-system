package com.rentacar.rentalsystem.car;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Bu testler sadece controller davranışını ölçer; erişim kuralları security/ altındaki testlerde.
@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(CarImageController.class)
class CarImageControllerTest {

    private static final UUID CAR_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CarImageService imageService;

    @Test
    void imageIsServedWithItsTypeAndLongCache() throws Exception {
        UUID imageId = UUID.randomUUID();
        when(imageService.getImage(CAR_ID, imageId)).thenReturn(image(imageId));

        mockMvc.perform(get("/api/cars/{carId}/images/{imageId}", CAR_ID, imageId))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(CarImageServiceTest.PNG))
                .andExpect(header().string("Cache-Control", containsString("max-age=31536000")));
    }

    @Test
    void coverIsServedWithShortCache() throws Exception {
        when(imageService.getCoverImage(CAR_ID)).thenReturn(image(UUID.randomUUID()));

        mockMvc.perform(get("/api/cars/{carId}/images/cover", CAR_ID))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(header().string("Cache-Control", containsString("max-age=60")));
    }

    @Test
    void listMarksFirstImageAsCoverAndGivesUrls() throws Exception {
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();
        when(imageService.listImages(CAR_ID)).thenReturn(List.of(
                new Summary(first, "image/png", 10, 0),
                new Summary(second, "image/jpeg", 20, 1)));

        mockMvc.perform(get("/api/cars/{carId}/images", CAR_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(first.toString()))
                .andExpect(jsonPath("$[0].cover").value(true))
                .andExpect(jsonPath("$[0].url").value("/api/cars/" + CAR_ID + "/images/" + first))
                .andExpect(jsonPath("$[1].cover").value(false));
    }

    @Test
    void uploadReturns201WithTheCarsImages() throws Exception {
        UUID imageId = UUID.randomUUID();
        when(imageService.addImages(eq(CAR_ID), anyList()))
                .thenReturn(List.of(new Summary(imageId, "image/png", 10, 0)));

        mockMvc.perform(multipart("/api/cars/{carId}/images", CAR_ID)
                        .file(new MockMultipartFile("files", "on.png", "image/png", CarImageServiceTest.PNG)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].id").value(imageId.toString()))
                .andExpect(jsonPath("$[0].cover").value(true));
    }

    @Test
    void deleteReturns204() throws Exception {
        UUID imageId = UUID.randomUUID();

        mockMvc.perform(delete("/api/cars/{carId}/images/{imageId}", CAR_ID, imageId))
                .andExpect(status().isNoContent());

        verify(imageService).deleteImage(CAR_ID, imageId);
    }

    private static CarImage image(UUID id) {
        CarImage image = new CarImage();
        image.setId(id);
        image.setContentType("image/png");
        image.setData(CarImageServiceTest.PNG);
        image.setSizeBytes(CarImageServiceTest.PNG.length);
        return image;
    }

    /** Testte CarImageSummary yerine geçen basit kayıt. */
    private record Summary(UUID getId, String getContentType, int getSizeBytes, int getSortOrder)
            implements CarImageSummary {
    }
}
