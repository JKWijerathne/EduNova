package com.edunova.notificationservice.repository;

import com.edunova.notificationservice.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    Optional<Notification> findByIdAndStudentId(Long id, Long studentId);
}
