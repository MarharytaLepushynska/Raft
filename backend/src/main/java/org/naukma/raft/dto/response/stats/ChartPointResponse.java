package org.naukma.raft.dto.response.stats;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Represents a single data point on a productivity or financial chart.
 */
@Data
@Builder
public class ChartPointResponse {
    /** The time period identifier or category label (e.g., day name, date). */
    private String label;
    /** The number of compiled planning entries or items (e.g., completed tasks count). */
    private long count;
    /** The total monetary sum calculated for this point (e.g., total expenses). */
    private BigDecimal amount;
}
