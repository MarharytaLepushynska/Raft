package org.naukma.raft.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Data transfer object to mutate structural definitions of an folder.
 */
@Data
public class FolderPatchRequest {

    /** The modified title for the folder asset binder. */
    @Size(max = 120, message = "Name must be at most 120 characters")
    private String name;
}
