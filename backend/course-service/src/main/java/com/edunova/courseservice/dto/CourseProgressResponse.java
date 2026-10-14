package com.edunova.courseservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CourseProgressResponse {
    private Long courseId;
    private int completionPercentage;
    private long totalLessons;
    private List<Long> completedLessonIds;
    private long totalQuizzes;
    private List<Long> passedQuizIds;
}
