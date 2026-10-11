package com.edunova.courseservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class SectionRequest {
    @NotNull
    private Long courseId;

    @NotBlank
    private String title;

    @NotNull
    @PositiveOrZero
    private Integer sortOrder;
}
