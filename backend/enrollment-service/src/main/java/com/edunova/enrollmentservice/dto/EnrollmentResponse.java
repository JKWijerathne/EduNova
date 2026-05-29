package com.edunova.enrollmentservice.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentResponse {

    private Long id;
    private Long studentId;
    private Long courseId;
    private LocalDateTime enrolledAt;
}