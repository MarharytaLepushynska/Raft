package org.naukma.raft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.naukma.raft.enums.FolderType;

/**
 * Data transfer object for creating a new folder.
 */
@Data
public class FolderRequest {
    /** The name of the folder. */
    @NotBlank(message = "Title is required")
    @Size(max = 120, message = "Name must be at most 120 characters")
    private String name;

    /** The type of items this folder stores (e.g., NOTES or TASKS). */
    @NotNull(message = "Folder type is required")
    private FolderType type;

    /** The ID of the workspace this folder belongs to. */
    private Long workspaceId;
}
