package org.naukma.raft.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Data transfer object containing parameters to log a new bill and split it among workspace members.
 */
@Data
public class CreateExpenseRequest {

    /** Brief caption or title describing the expense transaction. */
    @NotBlank(message = "Title is required")
    private String title;

    /** Total monetary amount of the invoice or receipt. */
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    private BigDecimal amount;

    /** Target workspace boundary identifier where the expense ledger is anchored. */
    @NotNull(message = "Workspace is required")
    private Long workspaceId;

    /** List of user IDs responsible for sharing fractions of this bill. */
    private List<Long> participantIds;
}
