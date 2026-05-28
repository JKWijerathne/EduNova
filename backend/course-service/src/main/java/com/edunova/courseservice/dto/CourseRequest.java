package com.edunova.courseservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CourseRequest {

    @NotBlank(message = "Course title is required")
    private String title;

    private String description;

    private String instructorName;

    private String duration;
}