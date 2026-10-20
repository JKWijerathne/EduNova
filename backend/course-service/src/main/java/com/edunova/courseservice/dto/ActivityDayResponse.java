package com.edunova.courseservice.dto;

import java.time.LocalDate;

public record ActivityDayResponse(
        LocalDate date,
        int activityCount,
        int minutesSpent,
        int lessonsCompletedCount,
        int intensity
) {
}
