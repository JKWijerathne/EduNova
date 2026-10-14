package com.edunova.courseservice.dto;

import com.edunova.courseservice.entity.QuizQuestionType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuizQuestionResponse {
    private Long id;
    private String questionText;
    private QuizQuestionType questionType;
    private List<String> options;
    private Integer sortOrder;
}
