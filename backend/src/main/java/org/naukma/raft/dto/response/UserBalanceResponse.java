package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Financial footprint summary mapping a participant's net standing in a workspace pool.
 */
@Data
@Builder
public class UserBalanceResponse {
    private UserSummaryResponse user;
    private BigDecimal totalPaid;
    private BigDecimal totalOwes;
    private BigDecimal balance;
}
