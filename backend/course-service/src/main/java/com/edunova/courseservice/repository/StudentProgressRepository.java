package com.edunova.courseservice.repository;

import com.edunova.courseservice.entity.StudentProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentProgressRepository extends JpaRepository<StudentProgress, Long> {
    Optional<StudentProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    List<StudentProgress> findByStudentIdAndLessonSectionCourseIdAndCompletedTrue(Long studentId, Long courseId);
}
