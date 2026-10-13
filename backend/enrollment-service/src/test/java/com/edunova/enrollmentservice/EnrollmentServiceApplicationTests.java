package com.edunova.enrollmentservice;

import com.edunova.enrollmentservice.entity.Enrollment;
import com.edunova.enrollmentservice.repository.EnrollmentRepository;
import com.edunova.enrollmentservice.service.EnrollmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:edunova_enrollment_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
class EnrollmentServiceApplicationTests {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private EnrollmentService enrollmentService;

    @Test
    void contextLoads() {
    }

    @Test
    void adminCanRemoveAnEnrollment() {
        Enrollment enrollment = enrollmentRepository.save(Enrollment.builder()
                .studentId(123L)
                .studentName("Student")
                .studentEmail("student@example.com")
                .courseId(456L)
                .enrolledAt(LocalDateTime.now())
                .build());

        assertTrue(enrollmentRepository.existsById(enrollment.getId()));
        enrollmentService.unenrollByAdmin(enrollment.getId());
        assertFalse(enrollmentRepository.existsById(enrollment.getId()));
    }
}
