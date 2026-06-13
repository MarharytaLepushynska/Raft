package org.naukma.raft.controller;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.response.AchievementResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.AchievementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping
    public ResponseEntity<List<AchievementResponse>> getAchievements(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(achievementService.getAchievements(user.getId()));
    }

    @GetMapping("/earned")
    public ResponseEntity<List<AchievementResponse>> getEarnedAchievements(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(achievementService.getEarnedAchievements(user.getId()));
    }
}