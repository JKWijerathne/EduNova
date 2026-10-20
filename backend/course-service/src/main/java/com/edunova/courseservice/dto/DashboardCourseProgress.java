package com.edunova.courseservice.dto;

public record DashboardCourseProgress(
        Long courseId,
        String courseTitle,
        int completionPercentage
) {
}
