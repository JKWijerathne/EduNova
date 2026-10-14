package com.edunova.courseservice.repository;

import com.edunova.courseservice.entity.StudentQuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentQuizAttemptRepository extends JpaRepository<StudentQuizAttempt, Long> {
    boolean existsByStudentIdAndQuizIdAndPassedTrue(Long studentId, Long quizId);

    @Query("""
            select distinct attempt.quiz.id
            from StudentQuizAttempt attempt
            left join attempt.quiz.section section
            left join attempt.quiz.lesson lesson
            left join lesson.section lessonSection
            where attempt.studentId = :studentId
              and attempt.passed = true
              and (section.course.id = :courseId
                   or lessonSection.course.id = :courseId)
            """)
    List<Long> findPassedQuizIdsByStudentAndCourse(
            @Param("studentId") Long studentId,
            @Param("courseId") Long courseId
    );
}
