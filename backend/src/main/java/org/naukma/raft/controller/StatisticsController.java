package org.naukma.raft.controller;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.response.ProductivityStatisticsResponse;
import org.naukma.raft.dto.response.stats.StatisticsResponse;
import org.naukma.raft.enums.StatsPeriod;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.StatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for retrieving user productivity metrics and workspace statistical summaries.
 */
@RestController
@RequestMapping("api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    /** Compiles performance ratios, task competition velocities, and user metrics. */
    @GetMapping("/productivity")
    public ResponseEntity<ProductivityStatisticsResponse> getProductivityStatistics(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(statisticsService.getProductivityStatistics(user.getId()));
    }

    /** Fetches contextual financial or progress charts filtered by a specific historical period. */
    @GetMapping
    public ResponseEntity<StatisticsResponse> getStatistics(
            @RequestParam(defaultValue = "WEEK") StatsPeriod period,
            @AuthenticationPrincipal CustomUserDetails user) {

        return ResponseEntity.ok(statisticsService.getStatistics(user.getId(), period));
    }
}
