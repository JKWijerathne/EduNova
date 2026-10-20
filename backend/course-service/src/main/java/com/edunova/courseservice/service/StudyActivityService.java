package com.edunova.courseservice.service;

import com.edunova.courseservice.entity.StudyActivityLog;
import com.edunova.courseservice.repository.StudyActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudyActivityService {

    private static final long MAX_HEARTBEAT_GAP_SECONDS = 90;

    private final StudyActivityLogRepository activityLogRepository;

    @Transactional
    public void recordHeartbeat(Long studentId) {
        LocalDateTime now = LocalDateTime.now();
        StudyActivityLog log = findOrCreateLog(studentId, now.toLocalDate());
        LocalDateTime previousHeartbeat = log.getLastHeartbeatAt();
        if (previousHeartbeat == null) {
            log.setLastHeartbeatAt(now);
            activityLogRepository.save(log);
            return;
        }

        long elapsedSeconds = Duration.between(previousHeartbeat, now).getSeconds();
        if (elapsedSeconds > MAX_HEARTBEAT_GAP_SECONDS) {
            log.setLastHeartbeatAt(now);
            activityLogRepository.save(log);
        } else if (elapsedSeconds >= 60) {
            log.setMinutesSpent(log.getMinutesSpent() + 1);
            log.setLastHeartbeatAt(now);
            activityLogRepository.save(log);
        }
    }

    @Transactional
    public void recordLessonCompleted(Long studentId) {
        StudyActivityLog log = findOrCreateLog(studentId, LocalDate.now());
        log.setLessonsCompletedCount(log.getLessonsCompletedCount() + 1);
        activityLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<StudyActivityLog> getActivity(Long studentId, LocalDate startDate, LocalDate endDate) {
        return activityLogRepository.findByStudentIdAndActivityDateBetweenOrderByActivityDateAsc(
                studentId,
                startDate,
                endDate
        );
    }

    @Transactional(readOnly = true)
    public List<StudyActivityLog> getAllActivity(Long studentId) {
        return activityLogRepository.findByStudentIdOrderByActivityDateAsc(studentId);
    }

    private StudyActivityLog findOrCreateLog(Long studentId, LocalDate activityDate) {
        return activityLogRepository.findByStudentIdAndActivityDate(studentId, activityDate)
                .orElseGet(() -> StudyActivityLog.builder()
                        .studentId(studentId)
                        .activityDate(activityDate)
                        .build());
    }
}
