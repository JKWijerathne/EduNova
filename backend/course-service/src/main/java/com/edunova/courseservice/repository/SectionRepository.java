package com.edunova.courseservice.repository;

import com.edunova.courseservice.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByCourseIdOrderBySortOrderAscIdAsc(Long courseId);

    Optional<Section> findByIdAndCourseId(Long id, Long courseId);
}
