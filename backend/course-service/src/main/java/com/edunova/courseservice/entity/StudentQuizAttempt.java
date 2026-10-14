package com.edunova.courseservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_quiz_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentQuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Quiz quiz;

    @Column(nullable = false)
    private Integer scoreObtained;

    @Column(nullable = false)
    private Integer totalMarks;

    @Column(nullable = false)
    private boolean passed;

    @Column(nullable = false)
    private Integer percentage;

    @Column(nullable = false)
    private LocalDateTime submittedAt;
}
