package com.edunova.courseservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizAnswerResult {
    private Long questionId;
    private String questionText;
    private Integer selectedOptionIndex;
    private Integer correctAnswerIndex;
    private String correctAnswer;
    private boolean correct;
}
