package com.edunova.notificationservice.controller;

import com.edunova.notificationservice.dto.CreateNotificationRequest;
import com.edunova.notificationservice.dto.EnrollmentNotificationRequest;
import com.edunova.notificationservice.entity.Notification;
import com.edunova.notificationservice.security.NotificationPrincipal;
import com.edunova.notificationservice.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(
            @AuthenticationPrincipal NotificationPrincipal principal
    ) {
        return ResponseEntity.ok(notificationService.getNotifications(principal.userId()));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Notification>> getNotifications(
            @PathVariable Long studentId,
            @AuthenticationPrincipal NotificationPrincipal principal
    ) {
        requireOwner(studentId, principal);
        return ResponseEntity.ok(notificationService.getNotifications(studentId));
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(
            @Valid @RequestBody CreateNotificationRequest request
    ) {
        return ResponseEntity.ok(notificationService.createNotification(request));
    }

    @PostMapping("/enrollment")
    public ResponseEntity<Void> sendEnrollmentNotification(
            @Valid @RequestBody EnrollmentNotificationRequest request,
            @AuthenticationPrincipal NotificationPrincipal principal
    ) {
        requireOwner(request.getStudentId(), principal);
        notificationService.createEnrollmentNotification(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/course-drop")
    public ResponseEntity<Void> sendCourseDropNotification(
            @Valid @RequestBody EnrollmentNotificationRequest request,
            @AuthenticationPrincipal NotificationPrincipal principal
    ) {
        requireOwner(request.getStudentId(), principal);
        notificationService.createCourseDropNotification(request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/read")
    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal NotificationPrincipal principal
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(id, principal.userId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> dismiss(
            @PathVariable Long id,
            @AuthenticationPrincipal NotificationPrincipal principal
    ) {
        notificationService.dismiss(id, principal.userId());
        return ResponseEntity.noContent().build();
    }

    private void requireOwner(Long studentId, NotificationPrincipal principal) {
        if (principal == null || !principal.userId().equals(studentId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only access your own notifications"
            );
        }
    }
}
