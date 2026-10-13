package com.edunova.courseservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CourseRequest {

    @NotBlank(message = "Course title is required")
    private String title;

    private String description;

    @NotBlank(message = "Instructor is required")
    private String instructorName;

    @NotBlank(message = "Course duration is required")
    private String duration;

    private String category;

    @NotNull(message = "Course price is required")
    @DecimalMin(value = "0.0", message = "Course price cannot be negative")
    private BigDecimal price;
}