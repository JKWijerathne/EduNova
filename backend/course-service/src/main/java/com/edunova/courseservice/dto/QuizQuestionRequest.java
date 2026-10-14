package com.edunova.courseservice.dto;

import com.edunova.courseservice.entity.QuizQuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.util.List;

@Data
public class QuizQuestionRequest {
    @NotBlank
    private String questionText;

    @NotNull
    private QuizQuestionType questionType;

    @NotEmpty
    private List<@NotBlank String> options;

    @NotNull
    @PositiveOrZero
    private Integer correctAnswerIndex;
}
