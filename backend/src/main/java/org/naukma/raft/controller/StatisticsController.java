package org.naukma.raft.controller;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.response.ProductivityStatisticsResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.StatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/productivity")
    public ResponseEntity<ProductivityStatisticsResponse> getProductivityStatistics(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(statisticsService.getProductivityStatistics(user.getId()));
    }
}