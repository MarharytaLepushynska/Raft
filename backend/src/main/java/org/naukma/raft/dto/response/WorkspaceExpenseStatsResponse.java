package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Aggregated transaction pool analysis tracking total expenditures and member standing rows.
 */
@Data
@Builder
public class WorkspaceExpenseStatsResponse {
    private BigDecimal totalAmount;
    private List<UserBalanceResponse> balances;
    private List<ExpenseResponse> recentExpenses;
}
