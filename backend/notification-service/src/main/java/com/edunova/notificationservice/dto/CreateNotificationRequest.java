package com.edunova.notificationservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateNotificationRequest {

    @NotNull
    private Long studentId;

    @NotBlank
    @Size(max = 160)
    private String title;

    @NotBlank
    @Size(max = 2000)
    private String message;

    @Size(max = 40)
    private String type;
}
