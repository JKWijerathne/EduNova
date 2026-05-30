package com.edunova.notificationservice.controller;

import com.edunova.notificationservice.dto.EnrollmentNotificationRequest;
import com.edunova.notificationservice.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/enrollment")
    public ResponseEntity<Map<String, String>> sendEnrollmentNotification(
            @Valid @RequestBody EnrollmentNotificationRequest request
    ) {
        String message = notificationService.sendEnrollmentNotification(request);

        return ResponseEntity.ok(
                Map.of("message", message)
        );
    }
}