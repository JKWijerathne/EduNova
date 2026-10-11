package com.edunova.courseservice.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class LessonOrderRequest {
    @NotNull
    private Long sectionId;

    @NotEmpty
    private List<@NotNull Long> lessonIds;
}
