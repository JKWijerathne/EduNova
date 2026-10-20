package com.edunova.courseservice.repository;

import com.edunova.courseservice.entity.StudyActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StudyActivityLogRepository extends JpaRepository<StudyActivityLog, Long> {
    Optional<StudyActivityLog> findByStudentIdAndActivityDate(Long studentId, LocalDate activityDate);

    List<StudyActivityLog> findByStudentIdAndActivityDateBetweenOrderByActivityDateAsc(
            Long studentId,
            LocalDate startDate,
            LocalDate endDate
    );

    List<StudyActivityLog> findByStudentIdOrderByActivityDateAsc(Long studentId);
}
