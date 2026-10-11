package com.edunova.courseservice.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SectionOrderRequest {
    @NotNull
    private Long courseId;

    @NotEmpty
    private List<@NotNull Long> sectionIds;
}
