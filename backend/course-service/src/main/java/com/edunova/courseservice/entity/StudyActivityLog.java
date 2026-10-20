package com.edunova.courseservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_activity_logs",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "activity_date"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(nullable = false)
    @Builder.Default
    private int minutesSpent = 0;

    @Column(nullable = false)
    @Builder.Default
    private int lessonsCompletedCount = 0;

    private LocalDateTime lastHeartbeatAt;
}
