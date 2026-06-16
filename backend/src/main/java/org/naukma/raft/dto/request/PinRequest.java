package org.naukma.raft.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Payload to pin an item, shortcut, or note widget onto a workspace dashboard canvas.
 */
@Data
public class PinRequest {
    /** Optional reference to an attached note. */
    private Long noteId;
    /** URL of an optional cover image for the dashboard shortcut. */
    private String imageUrl;
    /** Header or label text displayed on the pinned card. */
    private String title;
    /** Text body snippet displayed on the card. */
    private String text;
    /** Horizontal position coordinate on the dashboard layout grid. */
    @NotNull
    private Double x;
    /** Vertical position coordinate on the dashboard layout grid. */
    @NotNull
    private Double y;
    /** Rotation angle value for visual styling on the dashboard layout canvas. */
    @NotNull
    private Double rotate;
}