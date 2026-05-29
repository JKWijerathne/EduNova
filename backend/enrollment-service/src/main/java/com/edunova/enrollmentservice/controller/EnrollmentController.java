package com.edunova.enrollmentservice.controller;

import com.edunova.enrollmentservice.dto.EnrollmentRequest;
import com.edunova.enrollmentservice.dto.EnrollmentResponse;
import com.edunova.enrollmentservice.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public ResponseEntity<EnrollmentResponse> enroll(
            @Valid @RequestBody EnrollmentRequest request,
            Authentication authentication
    ) {
        Long studentId = (Long) authentication.getPrincipal();
        EnrollmentResponse response = enrollmentService.enroll(studentId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-courses")
    public ResponseEntity<List<EnrollmentResponse>> getMyCourses(
            Authentication authentication
    ) {
        Long studentId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(enrollmentService.getMyEnrollments(studentId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> unenroll(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Long studentId = (Long) authentication.getPrincipal();
        enrollmentService.unenroll(id, studentId);
        return ResponseEntity.noContent().build();
    }
}