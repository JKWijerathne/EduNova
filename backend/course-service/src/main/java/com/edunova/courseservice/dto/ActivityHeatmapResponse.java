package com.edunova.courseservice.dto;

import java.time.LocalDate;
import java.util.List;

public record ActivityHeatmapResponse(
        LocalDate startDate,
        LocalDate endDate,
        List<ActivityDayResponse> days
) {
}
