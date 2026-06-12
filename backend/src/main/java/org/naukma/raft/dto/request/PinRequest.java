package org.naukma.raft.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PinRequest {
    private Long noteId;
    private String imageUrl;
    private String title;
    private String text;
    @NotNull
    private Double x;
    @NotNull
    private Double y;
    @NotNull
    private Double rotate;
}