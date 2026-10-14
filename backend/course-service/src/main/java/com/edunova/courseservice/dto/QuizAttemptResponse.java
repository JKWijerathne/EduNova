package com.edunova.courseservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuizAttemptResponse {
    private Long attemptId;
    private Long quizId;
    private Integer scoreObtained;
    private Integer totalMarks;
    private Integer percentage;
    private Integer passingMarkPercentage;
    private boolean passed;
    private LocalDateTime submittedAt;
    private List<QuizAnswerResult> answers;
}
