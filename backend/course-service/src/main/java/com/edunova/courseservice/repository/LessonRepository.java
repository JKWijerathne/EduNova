package com.edunova.courseservice.repository;

import com.edunova.courseservice.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findBySectionIdInOrderBySortOrderAscIdAsc(List<Long> sectionIds);

    List<Lesson> findBySectionIdOrderBySortOrderAscIdAsc(Long sectionId);

    Optional<Lesson> findByIdAndSectionCourseId(Long id, Long courseId);

    long countBySectionCourseId(Long courseId);
}
