package org.naukma.raft.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class PersonalExpenseStatsResponse {
    private BigDecimal totalOwedToMe;
    private BigDecimal totalIOwe;
    @JsonProperty("iOwe")
    private List<DebtSummaryResponse> iOwe;
    private List<DebtSummaryResponse> owedToMe;

    private List<ExpenseResponse> history;
    private int historyPage;
    private int historyTotalPages;
    private long historyTotal;
}
