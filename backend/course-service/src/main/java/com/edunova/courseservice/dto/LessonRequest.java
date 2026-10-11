package com.edunova.courseservice.dto;

import com.edunova.courseservice.entity.LessonContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class LessonRequest {
    @NotNull
    private Long sectionId;

    @NotBlank
    private String title;

    @NotNull
    private LessonContentType contentType;

    private String contentUrl;

    private String bodyText;

    @PositiveOrZero
    private Integer duration;

    @NotNull
    @PositiveOrZero
    private Integer sortOrder;
}
