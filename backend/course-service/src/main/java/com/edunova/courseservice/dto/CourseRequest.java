package com.edunova.courseservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CourseRequest {

    @NotBlank(message = "Course title is required")
    private String title;

    private String description;

    private String instructorName;

    private String duration;

    private String category;

    @DecimalMin(value = "0.0", message = "Course price cannot be negative")
    private BigDecimal price;
}