package com.edunova.courseservice.controller;

import com.edunova.courseservice.dto.*;
import com.edunova.courseservice.security.CoursePrincipal;
import com.edunova.courseservice.service.LearningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;

    @GetMapping("/api/courses/{courseId}/curriculum")
    public ResponseEntity<List<SectionResponse>> getCurriculum(@PathVariable Long courseId) {
        return ResponseEntity.ok(learningService.getCurriculum(courseId));
    }

    @PostMapping("/api/courses/sections")
    public ResponseEntity<SectionResponse> createSection(@Valid @RequestBody SectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(learningService.createSection(request));
    }

    @PostMapping("/api/courses/lessons")
    public ResponseEntity<LessonResponse> createLesson(@Valid @RequestBody LessonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(learningService.createLesson(request));
    }

    @PutMapping("/api/courses/sections/order")
    public ResponseEntity<List<SectionResponse>> reorderSections(@Valid @RequestBody SectionOrderRequest request) {
        return ResponseEntity.ok(learningService.reorderSections(request));
    }

    @PutMapping("/api/courses/lessons/order")
    public ResponseEntity<List<LessonResponse>> reorderLessons(@Valid @RequestBody LessonOrderRequest request) {
        return ResponseEntity.ok(learningService.reorderLessons(request));
    }

    @PostMapping("/api/progress/lessons/{lessonId}/complete")
    public ResponseEntity<Void> completeLesson(
            @PathVariable Long lessonId,
            Authentication authentication
    ) {
        CoursePrincipal student = (CoursePrincipal) authentication.getPrincipal();
        learningService.completeLesson(student.userId(), lessonId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/progress/courses/{courseId}")
    public ResponseEntity<CourseProgressResponse> getCourseProgress(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        CoursePrincipal student = (CoursePrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(learningService.getCourseProgress(student.userId(), courseId));
    }
}
