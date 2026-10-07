package com.edunova.enrollmentservice.service;

import com.edunova.enrollmentservice.dto.EnrollmentNotificationRequest;
import com.edunova.enrollmentservice.dto.EnrollmentRequest;
import com.edunova.enrollmentservice.dto.EnrollmentResponse;
import com.edunova.enrollmentservice.entity.Enrollment;
import com.edunova.enrollmentservice.repository.EnrollmentRepository;
import com.edunova.enrollmentservice.security.EnrollmentPrincipal;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private static final Logger logger = LoggerFactory.getLogger(EnrollmentService.class);

    private final EnrollmentRepository enrollmentRepository;
    private final RestTemplate restTemplate;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    public EnrollmentResponse enroll(EnrollmentPrincipal student, EnrollmentRequest request, String authorization) {

        boolean alreadyEnrolled = enrollmentRepository.existsByStudentIdAndCourseId(
                student.userId(),
                request.getCourseId()
        );

        if (alreadyEnrolled) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Student already enrolled in this course"
            );
        }

        Enrollment enrollment = Enrollment.builder()
                .studentId(student.userId())
                .studentName(student.name())
                .studentEmail(student.email())
                .courseId(request.getCourseId())
                .enrolledAt(LocalDateTime.now())
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

        sendEnrollmentNotification(savedEnrollment, authorization);

        return mapToResponse(savedEnrollment);
    }

    public List<EnrollmentResponse> getMyEnrollments(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

        public List<EnrollmentResponse> getAllEnrollments() {
                return enrollmentRepository.findAll()
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

    private void sendEnrollmentNotification(Enrollment enrollment, String authorization) {
        try {
            EnrollmentNotificationRequest notificationRequest =
                    new EnrollmentNotificationRequest(
                            enrollment.getStudentId(),
                            enrollment.getCourseId()
                    );

            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.AUTHORIZATION, authorization);
            restTemplate.exchange(
                    notificationServiceUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(notificationRequest, headers),
                    Void.class
            );

        } catch (RestClientException e) {
            logger.warn("Notification service could not record enrollment {}: {}", enrollment.getId(), e.getMessage());
        }
    }

    private EnrollmentResponse mapToResponse(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .studentId(enrollment.getStudentId())
                .studentName(enrollment.getStudentName())
                .studentEmail(enrollment.getStudentEmail())
                .courseId(enrollment.getCourseId())
                .enrolledAt(enrollment.getEnrolledAt())
                .build();
    }
}