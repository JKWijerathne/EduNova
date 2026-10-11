package com.edunova.courseservice;

import com.edunova.courseservice.dto.CourseProgressResponse;
import com.edunova.courseservice.dto.LessonRequest;
import com.edunova.courseservice.dto.LessonOrderRequest;
import com.edunova.courseservice.dto.SectionRequest;
import com.edunova.courseservice.entity.Course;
import com.edunova.courseservice.entity.LessonContentType;
import com.edunova.courseservice.repository.CourseRepository;
import com.edunova.courseservice.service.LearningService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
    }
}
