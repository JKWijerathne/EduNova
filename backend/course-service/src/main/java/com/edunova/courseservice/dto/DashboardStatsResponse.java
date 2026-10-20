package com.edunova.courseservice.dto;

import java.util.List;

public record DashboardStatsResponse(
        int currentStreak,
        long totalStudyMinutes,
        int activeCourseCount,
        List<DashboardCourseProgress> courseProgress
) {
}
