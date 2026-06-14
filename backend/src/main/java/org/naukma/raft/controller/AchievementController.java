package org.naukma.raft.controller;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.response.AchievementResponse;
import org.naukma.raft.entity.Achievement;
import org.naukma.raft.entity.UserAchievement;
import org.naukma.raft.repository.AchievementRepository;
import org.naukma.raft.repository.UserAchievementRepository;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.AchievementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;

    @GetMapping("/my")
    public ResponseEntity<List<AchievementResponse>> getMyAchievements(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((CustomUserDetails) userDetails).getId();

        List<Achievement> all = achievementRepository.findAll();
        List<UserAchievement> earned = userAchievementRepository.findByUser_Id(userId);

        Map<Long, LocalDateTime> earnedMap = earned.stream()
                .collect(Collectors.toMap(
                        ua -> ua.getAchievement().getId(),
                        UserAchievement::getEarnedAt
                ));

        List<AchievementResponse> response = all.stream()
                .map(a -> AchievementResponse.builder()
                        .id(String.valueOf(a.getId()))
                        .code(a.getCode())
                        .title(a.getTitle())
                        .description(a.getDescription())
                        .icon(a.getIcon())
                        .earned(earnedMap.containsKey(a.getId()))
                        .earnedAt(earnedMap.get(a.getId()))
                        .build())
                .toList();

        return ResponseEntity.ok(response);
    }

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
