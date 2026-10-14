package com.edunova.courseservice.service;

import com.edunova.courseservice.dto.*;
import com.edunova.courseservice.entity.*;
import com.edunova.courseservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final StudentQuizAttemptRepository attemptRepository;

    @Transactional
    public QuizSummaryResponse createQuiz(CreateQuizRequest request) {
        boolean sectionSelected = request.getSectionId() != null;
        boolean lessonSelected = request.getLessonId() != null;
        if (sectionSelected == lessonSelected) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A quiz must belong to exactly one section or lesson");
        }
        if (request.getPassingMarkPercentage() == null
                || request.getPassingMarkPercentage() < 0
                || request.getPassingMarkPercentage() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passing mark must be between 0 and 100");
        }

        Section section = sectionSelected
                ? sectionRepository.findById(request.getSectionId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"))
                : null;
        Lesson lesson = lessonSelected
                ? lessonRepository.findById(request.getLessonId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"))
                : null;

        for (QuizQuestionRequest question : request.getQuestions()) {
            validateQuestion(question);
        }

        Quiz quiz = quizRepository.save(Quiz.builder()
                .section(section)
                .lesson(lesson)
                .title(request.getTitle().trim())
                .passingMarkPercentage(request.getPassingMarkPercentage())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .questionCount(request.getQuestions().size())
                .build());

        List<QuizQuestion> questions = IntStream.range(0, request.getQuestions().size())
                .mapToObj(index -> {
                    QuizQuestionRequest question = request.getQuestions().get(index);
                    return QuizQuestion.builder()
                            .quiz(quiz)
                            .questionText(question.getQuestionText().trim())
                            .questionType(question.getQuestionType())
                            .options(question.getOptions().stream().map(String::trim).toList())
                            .correctAnswerIndex(question.getCorrectAnswerIndex())
                            .sortOrder(index)
                            .build();
                })
                .toList();
        questionRepository.saveAll(questions);
        return toSummary(quiz);
    }

    @Transactional(readOnly = true)
    public QuizResponse getQuiz(Long quizId) {
        Quiz quiz = requireQuiz(quizId);
        List<QuizQuestionResponse> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quizId)
                .stream()
                .map(question -> QuizQuestionResponse.builder()
                        .id(question.getId())
                        .questionText(question.getQuestionText())
                        .questionType(question.getQuestionType())
                        .options(question.getOptions())
                        .sortOrder(question.getSortOrder())
                        .build())
                .toList();
        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .passingMarkPercentage(quiz.getPassingMarkPercentage())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .questions(questions)
                .build();
    }

    @Transactional
    public QuizAttemptResponse submitQuiz(Long studentId, Long quizId, SubmitQuizRequest request) {
        Quiz quiz = requireQuiz(quizId);
        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quizId);
        if (request.getAnswers() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Answers are required");
        }
        if (request.getAnswers().size() > questions.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many answers were submitted");
        }

        Map<Long, Integer> selectedAnswers = new HashMap<>();
        for (QuizAnswerRequest answer : request.getAnswers()) {
            if (answer == null || answer.getQuestionId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each answer must specify a question");
            }
            if (selectedAnswers.containsKey(answer.getQuestionId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each quiz question must have exactly one answer");
            }
            selectedAnswers.put(answer.getQuestionId(), answer.getSelectedOptionIndex());
        }
        Set<Long> questionIds = new HashSet<>(questions.stream().map(QuizQuestion::getId).toList());
        if (!questionIds.containsAll(selectedAnswers.keySet())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Answers must match the questions in this quiz");
        }

        int score = 0;
        for (QuizQuestion question : questions) {
            Integer selectedIndex = selectedAnswers.get(question.getId());
            if (selectedIndex != null && (selectedIndex < 0 || selectedIndex >= question.getOptions().size())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A selected answer is not valid for its question");
            }
            if (selectedIndex != null && selectedIndex.equals(question.getCorrectAnswerIndex())) {
                score++;
            }
        }
        int totalMarks = questions.size();
        int percentage = (int) Math.round(score * 100.0 / totalMarks);
        boolean passed = percentage >= quiz.getPassingMarkPercentage();
        LocalDateTime submittedAt = LocalDateTime.now();
        StudentQuizAttempt attempt = attemptRepository.save(StudentQuizAttempt.builder()
                .studentId(studentId)
                .quiz(quiz)
                .scoreObtained(score)
                .totalMarks(totalMarks)
                .percentage(percentage)
                .passed(passed)
                .submittedAt(submittedAt)
                .build());

        List<QuizAnswerResult> results = questions.stream()
                .map(question -> {
                    Integer selectedIndex = selectedAnswers.get(question.getId());
                    int correctIndex = question.getCorrectAnswerIndex();
                    return QuizAnswerResult.builder()
                            .questionId(question.getId())
                            .questionText(question.getQuestionText())
                            .selectedOptionIndex(selectedIndex)
                            .correctAnswerIndex(correctIndex)
                            .correctAnswer(question.getOptions().get(correctIndex))
                            .correct(selectedIndex != null && selectedIndex == correctIndex)
                            .build();
                })
                .toList();

        return QuizAttemptResponse.builder()
                .attemptId(attempt.getId())
                .quizId(quiz.getId())
                .scoreObtained(score)
                .totalMarks(totalMarks)
                .percentage(percentage)
                .passingMarkPercentage(quiz.getPassingMarkPercentage())
                .passed(passed)
                .submittedAt(submittedAt)
                .answers(results)
                .build();
    }

    private Quiz requireQuiz(Long quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
    }

    private void validateQuestion(QuizQuestionRequest question) {
        if (question.getQuestionType() == null || question.getOptions() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question type and answer options are required");
        }
        int optionCount = question.getOptions().size();
        if ((question.getQuestionType() == QuizQuestionType.TRUE_FALSE && optionCount != 2)
                || (question.getQuestionType() == QuizQuestionType.MULTIPLE_CHOICE && optionCount < 2)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    question.getQuestionType() == QuizQuestionType.TRUE_FALSE
                            ? "True/false questions must have exactly two options"
                            : "Multiple-choice questions must have at least two options");
        }
        if (question.getCorrectAnswerIndex() == null
                || question.getCorrectAnswerIndex() < 0
                || question.getCorrectAnswerIndex() >= optionCount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Correct answer index must match one of the options");
        }
        if (question.getOptions().stream().anyMatch(option -> option == null || option.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Answer options cannot be blank");
        }
    }

    private QuizSummaryResponse toSummary(Quiz quiz) {
        return QuizSummaryResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .passingMarkPercentage(quiz.getPassingMarkPercentage())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .questionCount(quiz.getQuestionCount())
                .build();
    }
}
