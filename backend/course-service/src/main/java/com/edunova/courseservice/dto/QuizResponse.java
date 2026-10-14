package com.edunova.courseservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuizResponse {
    private Long id;
    private String title;
    private Integer passingMarkPercentage;
    private Integer timeLimitMinutes;
    private List<QuizQuestionResponse> questions;
}
