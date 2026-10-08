package com.edunova.notificationservice.service;

import com.edunova.notificationservice.dto.CreateNotificationRequest;
import com.edunova.notificationservice.dto.EnrollmentNotificationRequest;
import com.edunova.notificationservice.entity.Notification;
import com.edunova.notificationservice.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:edunova_notification_service_test;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
class NotificationServiceTests {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @BeforeEach
    void clearNotifications() {
        notificationRepository.deleteAll();
    }

    @Test
    void enrollmentConfirmationIsStoredAsUnreadForTheStudent() {
        EnrollmentNotificationRequest request = new EnrollmentNotificationRequest();
        request.setStudentId(17L);
        request.setCourseId(42L);

        Notification notification = notificationService.createEnrollmentNotification(request);

        assertThat(notification.getId()).isNotNull();
        assertThat(notification.getStudentId()).isEqualTo(17L);
        assertThat(notification.getTitle()).isEqualTo("Course enrollment confirmed");
        assertThat(notification.getMessage()).contains("42");
        assertThat(notification.isRead()).isFalse();
        assertThat(notificationService.getNotifications(17L))
                .singleElement()
                .satisfies(stored -> {
                    assertThat(stored.getId()).isEqualTo(notification.getId());
                    assertThat(stored.getStudentId()).isEqualTo(17L);
                    assertThat(stored.isRead()).isFalse();
                });
        assertThat(notificationService.getNotifications(18L)).isEmpty();
    }

    @Test
    void courseDropNotificationIsStoredAsUnreadForTheStudent() {
        EnrollmentNotificationRequest request = new EnrollmentNotificationRequest();
        request.setStudentId(17L);
        request.setCourseId(42L);

        Notification notification = notificationService.createCourseDropNotification(request);

        assertThat(notification.getStudentId()).isEqualTo(17L);
        assertThat(notification.getTitle()).isEqualTo("Course enrollment cancelled");
        assertThat(notification.getMessage()).contains("42");
        assertThat(notification.getType()).isEqualTo("COURSE_DROP");
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    void notificationCanBeMarkedReadAndDismissedByItsOwner() {
        CreateNotificationRequest request = new CreateNotificationRequest();
        request.setStudentId(17L);
        request.setTitle("Course announcement");
        request.setMessage("The course has a new update.");
        request.setType("ANNOUNCEMENT");
        Notification notification = notificationService.createNotification(request);

        assertThat(notificationService.markAsRead(notification.getId(), 17L).isRead()).isTrue();
        notificationService.dismiss(notification.getId(), 17L);

        assertThat(notificationRepository.findById(notification.getId())).isEmpty();
    }
}
