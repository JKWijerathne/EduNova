package com.edunova.courseservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SubmitQuizRequest {
    @Valid
    @NotNull
    private List<@NotNull @Valid QuizAnswerRequest> answers;
}
