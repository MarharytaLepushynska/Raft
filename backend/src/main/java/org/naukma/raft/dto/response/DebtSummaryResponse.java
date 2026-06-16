package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Balance overview tracking a calculated debt relationship between two workspace profiles.
 */
@Data
@Builder
public class DebtSummaryResponse {
    private UserSummaryResponse user;
    private BigDecimal amount;
    private List<ExpenseResponse> relatedExpenses;
}
