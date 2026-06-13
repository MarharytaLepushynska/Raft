package org.naukma.raft.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ExpenseSplitResponse {
    private String id;
    private UserSummaryResponse user;
    private BigDecimal share;
    @JsonProperty("isSettled")
    private boolean isSettled;
}
