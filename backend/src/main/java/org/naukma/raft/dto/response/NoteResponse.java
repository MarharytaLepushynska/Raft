package org.naukma.raft.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import org.naukma.raft.enums.FolderType;

import java.time.LocalDateTime;

/**
 * Representation model showcasing a saved text document or canvas draft element.
 */
@Data
@Builder
public class NoteResponse {
    private String id;
    private String title;
    private String content;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;


    private String folderId;
    private String folderName;
    private FolderType folderType;

    private boolean canEdit;
    private UserSummaryResponse creator;
}
