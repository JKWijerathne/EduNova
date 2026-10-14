package com.edunova.courseservice.controller;

import com.edunova.courseservice.dto.CreateQuizRequest;
import com.edunova.courseservice.dto.QuizAttemptResponse;
import com.edunova.courseservice.dto.QuizResponse;
import com.edunova.courseservice.dto.QuizSummaryResponse;
import com.edunova.courseservice.dto.SubmitQuizRequest;
import com.edunova.courseservice.security.CoursePrincipal;
import com.edunova.courseservice.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @PostMapping
    public ResponseEntity<QuizSummaryResponse> createQuiz(@Valid @RequestBody CreateQuizRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.createQuiz(request));
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<QuizResponse> getQuiz(@PathVariable Long quizId) {
        return ResponseEntity.ok(quizService.getQuiz(quizId));
    }

    @PostMapping("/{quizId}/submit")
    public ResponseEntity<QuizAttemptResponse> submitQuiz(
            @PathVariable Long quizId,
            @Valid @RequestBody SubmitQuizRequest request,
            Authentication authentication
    ) {
        CoursePrincipal student = (CoursePrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(quizService.submitQuiz(student.userId(), quizId, request));
    }
}
