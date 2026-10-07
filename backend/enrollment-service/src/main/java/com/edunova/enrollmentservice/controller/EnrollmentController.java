package com.edunova.enrollmentservice.controller;

import com.edunova.enrollmentservice.dto.EnrollmentRequest;
import com.edunova.enrollmentservice.dto.EnrollmentResponse;
import com.edunova.enrollmentservice.service.EnrollmentService;
import com.edunova.enrollmentservice.security.EnrollmentPrincipal;
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
            @RequestHeader("Authorization") String authorization,
            Authentication authentication
    ) {
        EnrollmentPrincipal student = (EnrollmentPrincipal) authentication.getPrincipal();
        EnrollmentResponse response = enrollmentService.enroll(student, request, authorization);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-courses")
    public ResponseEntity<List<EnrollmentResponse>> getMyCourses(
            Authentication authentication
    ) {
        EnrollmentPrincipal student = (EnrollmentPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(enrollmentService.getMyEnrollments(student.userId()));
    }

    @GetMapping
    public ResponseEntity<List<EnrollmentResponse>> getAllEnrollments() {
        return ResponseEntity.ok(enrollmentService.getAllEnrollments());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> unenroll(
            @PathVariable Long id,
            Authentication authentication
    ) {
        EnrollmentPrincipal student = (EnrollmentPrincipal) authentication.getPrincipal();
        enrollmentService.unenroll(id, student.userId());
        return ResponseEntity.noContent().build();
    }
}