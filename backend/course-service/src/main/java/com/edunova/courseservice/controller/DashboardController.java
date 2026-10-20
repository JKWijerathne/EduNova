package com.edunova.courseservice.controller;

import com.edunova.courseservice.dto.ActivityHeatmapResponse;
import com.edunova.courseservice.dto.DashboardStatsResponse;
import com.edunova.courseservice.security.CoursePrincipal;
import com.edunova.courseservice.service.DashboardService;
import com.edunova.courseservice.service.StudyActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final StudyActivityService studyActivityService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats(
            @RequestParam(required = false) List<Long> courseIds,
            Authentication authentication
    ) {
        CoursePrincipal student = (CoursePrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(dashboardService.getStats(student.userId(), courseIds));
    }

    @GetMapping("/activity-heatmap")
    public ResponseEntity<ActivityHeatmapResponse> getActivityHeatmap(Authentication authentication) {
        CoursePrincipal student = (CoursePrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(dashboardService.getActivityHeatmap(student.userId()));
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Void> recordHeartbeat(Authentication authentication) {
        CoursePrincipal student = (CoursePrincipal) authentication.getPrincipal();
        studyActivityService.recordHeartbeat(student.userId());
        return ResponseEntity.noContent().build();
    }
}
