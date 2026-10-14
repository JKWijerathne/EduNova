package com.edunova.courseservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SectionResponse {
    private Long id;
    private String title;
    private Integer sortOrder;
    private List<LessonResponse> lessons;
    private List<QuizSummaryResponse> quizzes;
}
