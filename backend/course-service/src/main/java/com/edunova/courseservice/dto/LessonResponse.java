package com.edunova.courseservice.dto;

import com.edunova.courseservice.entity.LessonContentType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LessonResponse {
    private Long id;
    private String title;
    private LessonContentType contentType;
    private String contentUrl;
    private String bodyText;
    private Integer duration;
    private Integer sortOrder;
    private java.util.List<QuizSummaryResponse> quizzes;
}
