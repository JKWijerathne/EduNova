package com.edunova.courseservice;

import com.edunova.courseservice.dto.CourseProgressResponse;
import com.edunova.courseservice.dto.LessonRequest;
import com.edunova.courseservice.dto.LessonOrderRequest;
import com.edunova.courseservice.dto.SectionRequest;
import com.edunova.courseservice.dto.CreateQuizRequest;
import com.edunova.courseservice.dto.QuizAnswerRequest;
import com.edunova.courseservice.dto.QuizQuestionRequest;
import com.edunova.courseservice.dto.SubmitQuizRequest;
import com.edunova.courseservice.entity.Course;
import com.edunova.courseservice.entity.LessonContentType;
import com.edunova.courseservice.entity.QuizQuestionType;
import com.edunova.courseservice.repository.CourseRepository;
import com.edunova.courseservice.service.LearningService;
import com.edunova.courseservice.service.QuizService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:edunova_course_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
class CourseServiceApplicationTests {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private LearningService learningService;

    @Autowired
    private QuizService quizService;

    @Test
    void contextLoads() {
    }

    @Test
    @Transactional
    void curriculumOrderingAndStudentProgressAreScopedCorrectly() {
        Course course = courseRepository.save(Course.builder()
                .title("Learning course")
                .price(BigDecimal.ZERO)
                .build());

        SectionRequest sectionRequest = new SectionRequest();
        sectionRequest.setCourseId(course.getId());
        sectionRequest.setTitle("Foundations");
        sectionRequest.setSortOrder(0);
        var section = learningService.createSection(sectionRequest);

        LessonRequest firstLessonRequest = new LessonRequest();
        firstLessonRequest.setSectionId(section.getId());
        firstLessonRequest.setTitle("Introduction");
        firstLessonRequest.setContentType(LessonContentType.TEXT);
        firstLessonRequest.setBodyText("Welcome to the course.");
        firstLessonRequest.setSortOrder(0);
        var firstLesson = learningService.createLesson(firstLessonRequest);

        LessonRequest secondLessonRequest = new LessonRequest();
        secondLessonRequest.setSectionId(section.getId());
        secondLessonRequest.setTitle("Next steps");
        secondLessonRequest.setContentType(LessonContentType.LINK);
        secondLessonRequest.setContentUrl("https://example.com/next");
        secondLessonRequest.setSortOrder(1);
        var secondLesson = learningService.createLesson(secondLessonRequest);

        LessonOrderRequest orderRequest = new LessonOrderRequest();
        orderRequest.setSectionId(section.getId());
        orderRequest.setLessonIds(List.of(secondLesson.getId(), firstLesson.getId()));
        var reorderedLessons = learningService.reorderLessons(orderRequest);

        assertEquals(List.of(secondLesson.getId(), firstLesson.getId()),
                reorderedLessons.stream().map(lesson -> lesson.getId()).toList());
        assertEquals(List.of(secondLesson.getId(), firstLesson.getId()),
                learningService.getCurriculum(course.getId()).get(0).getLessons().stream()
                        .map(lesson -> lesson.getId())
                        .toList());

        learningService.completeLesson(42L, firstLesson.getId());
        learningService.completeLesson(42L, firstLesson.getId());
        CourseProgressResponse progress = learningService.getCourseProgress(42L, course.getId());

        assertEquals(2, progress.getTotalLessons());
        assertEquals(50, progress.getCompletionPercentage());
        assertEquals(List.of(firstLesson.getId()), progress.getCompletedLessonIds());
        assertEquals(0, learningService.getCourseProgress(43L, course.getId()).getCompletionPercentage());

        sectionRequest.setTitle("Course foundations");
        var updatedSection = learningService.updateSection(section.getId(), sectionRequest);
        assertEquals("Course foundations", updatedSection.getTitle());

        firstLessonRequest.setTitle("Course introduction");
        var updatedLesson = learningService.updateLesson(firstLesson.getId(), firstLessonRequest);
        assertEquals("Course introduction", updatedLesson.getTitle());

        learningService.deleteLesson(secondLesson.getId());
        assertEquals(1, learningService.getCurriculum(course.getId()).get(0).getLessons().size());

        learningService.deleteSection(section.getId());
        assertEquals(0, learningService.getCurriculum(course.getId()).size());
        assertEquals(0, learningService.getCourseProgress(42L, course.getId()).getCompletedLessonIds().size());
    }

    @Test
    @Transactional
    void quizAnswersAreGradedAndPassingQuizCountsTowardCourseProgress() {
        Course course = courseRepository.save(Course.builder()
                .title("Assessment course")
                .price(BigDecimal.ZERO)
                .build());
        SectionRequest sectionRequest = new SectionRequest();
        sectionRequest.setCourseId(course.getId());
        sectionRequest.setTitle("Knowledge check");
        sectionRequest.setSortOrder(0);
        var section = learningService.createSection(sectionRequest);

        QuizQuestionRequest firstQuestion = question("Which planet is known as the Red Planet?", "Mars", "Venus", 0);
        QuizQuestionRequest secondQuestion = question("Which planet is closest to the Sun?", "Mercury", "Earth", 0);
        CreateQuizRequest createRequest = new CreateQuizRequest();
        createRequest.setSectionId(section.getId());
        createRequest.setTitle("Astronomy quiz");
        createRequest.setPassingMarkPercentage(50);
        createRequest.setQuestions(List.of(firstQuestion, secondQuestion));
        var quiz = quizService.createQuiz(createRequest);

        var studentQuiz = quizService.getQuiz(quiz.getId());
        assertEquals(2, studentQuiz.getQuestions().size());
        assertEquals(List.of("Mars", "Venus"), studentQuiz.getQuestions().get(0).getOptions());
        assertEquals(1, learningService.getCurriculum(course.getId()).get(0).getQuizzes().size());

        QuizAnswerRequest correctAnswer = new QuizAnswerRequest();
        correctAnswer.setQuestionId(studentQuiz.getQuestions().get(0).getId());
        correctAnswer.setSelectedOptionIndex(0);
        SubmitQuizRequest submitRequest = new SubmitQuizRequest();
        submitRequest.setAnswers(List.of(correctAnswer));
        var attempt = quizService.submitQuiz(42L, quiz.getId(), submitRequest);

        assertEquals(1, attempt.getScoreObtained());
        assertEquals(2, attempt.getTotalMarks());
        assertEquals(50, attempt.getPercentage());
        assertTrue(attempt.isPassed());
        assertTrue(attempt.getAnswers().get(1).getSelectedOptionIndex() == null);
        assertFalse(attempt.getAnswers().get(1).isCorrect());

        var progress = learningService.getCourseProgress(42L, course.getId());
        assertEquals(1, progress.getTotalQuizzes());
        assertEquals(List.of(quiz.getId()), progress.getPassedQuizIds());
        assertEquals(100, progress.getCompletionPercentage());
    }

    private QuizQuestionRequest question(String text, String correctOption, String incorrectOption, int correctIndex) {
        QuizQuestionRequest question = new QuizQuestionRequest();
        question.setQuestionText(text);
        question.setQuestionType(QuizQuestionType.MULTIPLE_CHOICE);
        question.setOptions(List.of(correctOption, incorrectOption));
        question.setCorrectAnswerIndex(correctIndex);
        return question;
    }
}
