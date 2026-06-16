package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;
import org.naukma.raft.enums.PinType;

/**
 * Model defining styling metrics and attachments for a widget node pinned onto a canvas layout.
 */
@Data
@Builder
public class PinResponse {
    private String id;
    private PinType type;
    private String noteId;
    private String imageUrl;
    private String title;
    private String text;
    private Double x;
    private Double y;
    private Double rotate;
}
