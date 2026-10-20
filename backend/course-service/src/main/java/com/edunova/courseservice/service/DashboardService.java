package com.edunova.courseservice.service;

import com.edunova.courseservice.dto.ActivityDayResponse;
import com.edunova.courseservice.dto.ActivityHeatmapResponse;
import com.edunova.courseservice.dto.CourseProgressResponse;
import com.edunova.courseservice.dto.DashboardCourseProgress;
import com.edunova.courseservice.dto.DashboardStatsResponse;
import com.edunova.courseservice.entity.Course;
import com.edunova.courseservice.entity.StudyActivityLog;
import com.edunova.courseservice.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int ACTIVITY_DAYS = 365;

    private final StudyActivityService studyActivityService;
    private final LearningService learningService;
    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats(Long studentId, List<Long> courseIds) {
        List<StudyActivityLog> allActivity = studyActivityService.getAllActivity(studentId);
        long totalStudyMinutes = allActivity.stream().mapToLong(StudyActivityLog::getMinutesSpent).sum();
        int currentStreak = calculateStreak(allActivity);
        List<Long> uniqueCourseIds = courseIds == null
                ? List.of()
                : courseIds.stream().distinct().toList();
        Map<Long, Course> coursesById = new HashMap<>();
        courseRepository.findAllById(uniqueCourseIds)
                .forEach(course -> coursesById.put(course.getId(), course));

        if (coursesById.size() != uniqueCourseIds.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "One or more enrolled courses were not found");
        }

        List<DashboardCourseProgress> courseProgress = uniqueCourseIds.stream()
                .map(courseId -> {
                    Course course = coursesById.get(courseId);
                    CourseProgressResponse progress = learningService.getCourseProgress(studentId, courseId);
                    return new DashboardCourseProgress(
                            courseId,
                            course.getTitle(),
                            progress.getCompletionPercentage()
                    );
                })
                .toList();
        int activeCourseCount = (int) courseProgress.stream()
                .filter(progress -> progress.completionPercentage() < 100)
                .count();

        return new DashboardStatsResponse(currentStreak, totalStudyMinutes, activeCourseCount, courseProgress);
    }

    @Transactional(readOnly = true)
    public ActivityHeatmapResponse getActivityHeatmap(Long studentId) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(ACTIVITY_DAYS - 1L);
        Map<LocalDate, StudyActivityLog> activityByDate = new HashMap<>();
        studyActivityService.getActivity(studentId, startDate, endDate)
                .forEach(log -> activityByDate.put(log.getActivityDate(), log));
        List<ActivityDayResponse> days = startDate.datesUntil(endDate.plusDays(1))
                .map(date -> {
                    StudyActivityLog log = activityByDate.get(date);
                    int minutesSpent = log == null ? 0 : log.getMinutesSpent();
                    int lessonsCompleted = log == null ? 0 : log.getLessonsCompletedCount();
                    int activityCount = minutesSpent + lessonsCompleted;
                    return new ActivityDayResponse(
                            date,
                            activityCount,
                            minutesSpent,
                            lessonsCompleted,
                            intensityFor(activityCount)
                    );
                })
                .toList();
        return new ActivityHeatmapResponse(startDate, endDate, days);
    }

    private int calculateStreak(List<StudyActivityLog> activity) {
        HashSet<LocalDate> activeDates = new HashSet<>();
        activity.stream()
                .filter(log -> log.getMinutesSpent() > 0 || log.getLessonsCompletedCount() > 0)
                .map(StudyActivityLog::getActivityDate)
                .forEach(activeDates::add);

        LocalDate today = LocalDate.now();
        LocalDate streakDate = activeDates.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (activeDates.contains(streakDate)) {
            streak++;
            streakDate = streakDate.minusDays(1);
        }
        return streak;
    }

    private int intensityFor(int activityCount) {
        if (activityCount == 0) return 0;
        if (activityCount < 15) return 1;
        if (activityCount < 30) return 2;
        if (activityCount < 60) return 3;
        return 4;
    }
}
