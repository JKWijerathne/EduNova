package com.edunova.courseservice.service;

import com.edunova.courseservice.dto.*;
import com.edunova.courseservice.entity.*;
import com.edunova.courseservice.repository.CourseRepository;
import com.edunova.courseservice.repository.LessonRepository;
import com.edunova.courseservice.repository.SectionRepository;
import com.edunova.courseservice.repository.StudentProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.net.URI;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LearningService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final StudentProgressRepository progressRepository;

    @Transactional(readOnly = true)
    public List<SectionResponse> getCurriculum(Long courseId) {
        requireCourse(courseId);
        List<Section> sections = sectionRepository.findByCourseIdOrderBySortOrderAscIdAsc(courseId);
        List<Long> sectionIds = sections.stream().map(Section::getId).toList();
        List<Lesson> lessons = sectionIds.isEmpty()
                ? List.of()
                : lessonRepository.findBySectionIdInOrderBySortOrderAscIdAsc(sectionIds);

        return sections.stream()
                .map(section -> SectionResponse.builder()
                        .id(section.getId())
                        .title(section.getTitle())
                        .sortOrder(section.getSortOrder())
                        .lessons(lessons.stream()
                                .filter(lesson -> lesson.getSection().getId().equals(section.getId()))
                                .map(this::toLessonResponse)
                                .toList())
                        .build())
                .toList();
    }

    @Transactional
    public SectionResponse createSection(SectionRequest request) {
        Course course = requireCourse(request.getCourseId());
        Section section = sectionRepository.save(Section.builder()
                .course(course)
                .title(request.getTitle().trim())
                .sortOrder(request.getSortOrder())
                .build());
        return toSectionResponse(section, List.of());
    }

    @Transactional
    public SectionResponse updateSection(Long sectionId, SectionRequest request) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
        if (!section.getCourse().getId().equals(request.getCourseId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section does not belong to the requested course");
        }
        section.setTitle(request.getTitle().trim());
        section.setSortOrder(request.getSortOrder());
        return toSectionResponse(sectionRepository.save(section), List.of());
    }

    @Transactional
    public void deleteSection(Long sectionId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
        sectionRepository.delete(section);
    }

    @Transactional
    public LessonResponse createLesson(LessonRequest request) {
        Section section = sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
        validateLessonContent(request.getContentType(), request.getContentUrl(), request.getBodyText());
        Lesson lesson = lessonRepository.save(Lesson.builder()
                .section(section)
                .title(request.getTitle().trim())
                .contentType(request.getContentType())
                .contentUrl(blankToNull(request.getContentUrl()))
                .bodyText(blankToNull(request.getBodyText()))
                .duration(request.getDuration())
                .sortOrder(request.getSortOrder())
                .build());
        return toLessonResponse(lesson);
    }

    @Transactional
    public LessonResponse updateLesson(Long lessonId, LessonRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        if (!lesson.getSection().getId().equals(request.getSectionId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson cannot be moved to a different section while editing");
        }
        validateLessonContent(request.getContentType(), request.getContentUrl(), request.getBodyText());
        lesson.setTitle(request.getTitle().trim());
        lesson.setContentType(request.getContentType());
        lesson.setContentUrl(blankToNull(request.getContentUrl()));
        lesson.setBodyText(blankToNull(request.getBodyText()));
        lesson.setDuration(request.getDuration());
        lesson.setSortOrder(request.getSortOrder());
        return toLessonResponse(lessonRepository.save(lesson));
    }

    @Transactional
    public void deleteLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        lessonRepository.delete(lesson);
    }

    @Transactional
    public List<SectionResponse> reorderSections(SectionOrderRequest request) {
        List<Section> sections = sectionRepository.findByCourseIdOrderBySortOrderAscIdAsc(request.getCourseId());
        validateOrder(sections.stream().map(Section::getId).toList(), request.getSectionIds(), "section");
        List<Section> reordered = request.getSectionIds().stream()
                .map(id -> sections.stream().filter(section -> section.getId().equals(id)).findFirst().orElseThrow())
                .toList();
        for (int index = 0; index < reordered.size(); index++) {
            reordered.get(index).setSortOrder(index);
        }
        sectionRepository.saveAll(reordered);
        return getCurriculum(request.getCourseId());
    }

    @Transactional
    public List<LessonResponse> reorderLessons(LessonOrderRequest request) {
        Section section = sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
        List<Lesson> lessons = lessonRepository.findBySectionIdOrderBySortOrderAscIdAsc(section.getId());
        validateOrder(lessons.stream().map(Lesson::getId).toList(), request.getLessonIds(), "lesson");
        List<Lesson> reordered = request.getLessonIds().stream()
                .map(id -> lessons.stream().filter(lesson -> lesson.getId().equals(id)).findFirst().orElseThrow())
                .toList();
        for (int index = 0; index < reordered.size(); index++) {
            reordered.get(index).setSortOrder(index);
        }
        lessonRepository.saveAll(reordered);
        return reordered.stream().map(this::toLessonResponse).toList();
    }

    @Transactional
    public void completeLesson(Long studentId, Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        StudentProgress progress = progressRepository.findByStudentIdAndLessonId(studentId, lessonId)
                .orElseGet(() -> StudentProgress.builder()
                        .studentId(studentId)
                        .lesson(lesson)
                        .build());
        if (!progress.isCompleted()) {
            progress.setCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());
            progressRepository.save(progress);
        }
    }

    @Transactional(readOnly = true)
    public CourseProgressResponse getCourseProgress(Long studentId, Long courseId) {
        requireCourse(courseId);
        long totalLessons = lessonRepository.countBySectionCourseId(courseId);
        List<Long> completedLessonIds = progressRepository
                .findByStudentIdAndLessonSectionCourseIdAndCompletedTrue(studentId, courseId)
                .stream()
                .map(progress -> progress.getLesson().getId())
                .toList();
        int completionPercentage = totalLessons == 0
                ? 0
                : (int) (completedLessonIds.size() * 100 / totalLessons);
        return CourseProgressResponse.builder()
                .courseId(courseId)
                .completionPercentage(completionPercentage)
                .totalLessons(totalLessons)
                .completedLessonIds(completedLessonIds)
                .build();
    }

    private Course requireCourse(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    private void validateLessonContent(LessonContentType type, String contentUrl, String bodyText) {
        boolean hasUrl = contentUrl != null && !contentUrl.isBlank();
        boolean hasBody = bodyText != null && !bodyText.isBlank();
        if ((type == LessonContentType.TEXT && !hasBody)
                || (type != LessonContentType.TEXT && !hasUrl)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content is required for the selected lesson type");
        }
        if (type != LessonContentType.TEXT) {
            try {
                String scheme = URI.create(contentUrl.trim()).getScheme();
                if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson URLs must use HTTP or HTTPS");
                }
            } catch (IllegalArgumentException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson content URL is invalid");
            }
        }
    }

    private void validateOrder(List<Long> currentIds, List<Long> requestedIds, String itemName) {
        Set<Long> expected = new HashSet<>(currentIds);
        Set<Long> requested = new HashSet<>(requestedIds);
        if (requested.size() != requestedIds.size() || !expected.equals(requested)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The reordered " + itemName + " IDs must include each existing item exactly once");
        }
    }

    private SectionResponse toSectionResponse(Section section, List<LessonResponse> lessons) {
        return SectionResponse.builder()
                .id(section.getId())
                .title(section.getTitle())
                .sortOrder(section.getSortOrder())
                .lessons(lessons)
                .build();
    }

    private LessonResponse toLessonResponse(Lesson lesson) {
        return LessonResponse.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .contentType(lesson.getContentType())
                .contentUrl(lesson.getContentUrl())
                .bodyText(lesson.getBodyText())
                .duration(lesson.getDuration())
                .sortOrder(lesson.getSortOrder())
                .build();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
