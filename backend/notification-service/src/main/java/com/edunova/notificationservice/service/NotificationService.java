package com.edunova.notificationservice.service;

import com.edunova.notificationservice.dto.CreateNotificationRequest;
import com.edunova.notificationservice.dto.EnrollmentNotificationRequest;
import com.edunova.notificationservice.entity.Notification;
import com.edunova.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<Notification> getNotifications(Long studentId) {
        return notificationRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    public Notification createNotification(CreateNotificationRequest request) {
        Notification notification = Notification.builder()
                .studentId(request.getStudentId())
                .title(request.getTitle().trim())
                .message(request.getMessage().trim())
                .type(request.getType() == null || request.getType().isBlank()
                        ? "SYSTEM"
                        : request.getType().trim())
                .build();
        return notificationRepository.save(notification);
    }

    public Notification createEnrollmentNotification(EnrollmentNotificationRequest request) {
        return notificationRepository.save(Notification.builder()
                .studentId(request.getStudentId())
                .title("Course enrollment confirmed")
                .message("You are now enrolled in course #" + request.getCourseId() + ".")
                .type("ENROLLMENT_CONFIRMATION")
                .build());
    }

    public Notification markAsRead(Long notificationId, Long studentId) {
        Notification notification = getOwnedNotification(notificationId, studentId);
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void dismiss(Long notificationId, Long studentId) {
        notificationRepository.delete(getOwnedNotification(notificationId, studentId));
    }

    private Notification getOwnedNotification(Long notificationId, Long studentId) {
        return notificationRepository.findByIdAndStudentId(notificationId, studentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Notification not found"
                ));
    }
}
