package com.edunova.courseservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class CreateQuizRequest {
    private Long sectionId;
    private Long lessonId;

    @NotBlank
    private String title;

    @DecimalMin("0")
    @DecimalMax("100")
    private Integer passingMarkPercentage = 50;

    @Positive
    private Integer timeLimitMinutes;

    @NotEmpty
    @Valid
    private List<QuizQuestionRequest> questions;
}
