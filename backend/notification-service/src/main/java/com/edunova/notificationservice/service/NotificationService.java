package com.edunova.notificationservice.service;

import com.edunova.notificationservice.dto.EnrollmentNotificationRequest;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    public String sendEnrollmentNotification(EnrollmentNotificationRequest request) {

        String message = "Enrollment notification sent: Student ID "
                + request.getStudentId()
                + " enrolled in Course ID "
                + request.getCourseId();

        System.out.println(message);

        return message;
    }
}