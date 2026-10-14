package com.edunova.courseservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizSummaryResponse {
    private Long id;
    private String title;
    private Integer passingMarkPercentage;
    private Integer timeLimitMinutes;
    private Integer questionCount;
}
