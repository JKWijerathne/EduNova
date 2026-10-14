package com.edunova.courseservice.repository;

import com.edunova.courseservice.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findBySectionIdInOrderByIdAsc(List<Long> sectionIds);

    List<Quiz> findByLessonIdInOrderByIdAsc(List<Long> lessonIds);

    @Query("""
            select count(quiz)
            from Quiz quiz
            left join quiz.section section
            left join quiz.lesson lesson
            left join lesson.section lessonSection
            where section.course.id = :courseId
               or lessonSection.course.id = :courseId
            """)
    long countByCourseId(@Param("courseId") Long courseId);
}
