package com.edunova.courseservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class QuizAnswerRequest {
    @NotNull
    private Long questionId;

    @PositiveOrZero
    private Integer selectedOptionIndex;
}
