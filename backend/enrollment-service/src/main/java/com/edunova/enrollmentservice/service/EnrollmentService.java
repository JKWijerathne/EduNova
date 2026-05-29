package com.edunova.enrollmentservice.service;

import com.edunova.enrollmentservice.dto.EnrollmentRequest;
import com.edunova.enrollmentservice.dto.EnrollmentResponse;
import com.edunova.enrollmentservice.entity.Enrollment;
import com.edunova.enrollmentservice.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;

    public EnrollmentResponse enroll(Long studentId, EnrollmentRequest request) {

        boolean alreadyEnrolled = enrollmentRepository.existsByStudentIdAndCourseId(
                studentId,
                request.getCourseId()
        );

        if (alreadyEnrolled) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Student already enrolled in this course"
            );
        }

        Enrollment enrollment = Enrollment.builder()
                .studentId(studentId)
                .courseId(request.getCourseId())
                .enrolledAt(LocalDateTime.now())
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

        return mapToResponse(savedEnrollment);
    }

    public List<EnrollmentResponse> getMyEnrollments(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public void unenroll(Long enrollmentId, Long studentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Enrollment not found"
                ));

        if (!enrollment.getStudentId().equals(studentId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only delete your own enrollment"
            );
        }

        enrollmentRepository.delete(enrollment);
    }

    private EnrollmentResponse mapToResponse(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .studentId(enrollment.getStudentId())
                .courseId(enrollment.getCourseId())
                .enrolledAt(enrollment.getEnrolledAt())
                .build();
    }
}