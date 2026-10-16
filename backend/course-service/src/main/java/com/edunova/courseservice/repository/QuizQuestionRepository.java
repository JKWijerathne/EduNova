package com.edunova.courseservice.repository;

import com.edunova.courseservice.entity.QuizQuestion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    @EntityGraph(attributePaths = {"options"})
    List<QuizQuestion> findByQuizIdOrderBySortOrderAscIdAsc(Long quizId);
}
