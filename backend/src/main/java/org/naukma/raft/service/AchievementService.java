package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.response.AchievementResponse;
import org.naukma.raft.entity.Achievement;
import org.naukma.raft.entity.UserAchievement;
import org.naukma.raft.entity.User;
import org.naukma.raft.repository.AchievementRepository;
import org.naukma.raft.repository.UserAchievementRepository;
import org.naukma.raft.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.naukma.raft.errorsHadling.NotFoundException;

import java.util.List;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AchievementResponse> getAchievements(Long userId) {
        List<UserAchievement> earnedAchievements =
                userAchievementRepository.findByUser_IdOrderByEarnedAtDesc(userId);

        return achievementRepository.findAll()
                .stream()
                .map(achievement -> mapToResponse(achievement, earnedAchievements))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AchievementResponse> getEarnedAchievements(Long userId) {
        return userAchievementRepository.findByUser_IdOrderByEarnedAtDesc(userId)
                .stream()
                .map(userAchievement -> mapToResponse(
                        userAchievement.getAchievement(),
                        List.of(userAchievement)
                ))
                .toList();
    }

    private AchievementResponse mapToResponse(
            Achievement achievement,
            List<UserAchievement> earnedAchievements
    ) {
        UserAchievement earnedAchievement = earnedAchievements.stream()
                .filter(userAchievement -> userAchievement.getAchievement().getCode().equals(achievement.getCode()))
                .findFirst()
                .orElse(null);

        return AchievementResponse.builder()
                .id(achievement.getId().toString())
                .code(achievement.getCode())
                .title(achievement.getTitle())
                .description(achievement.getDescription())
                .icon(achievement.getIcon())
                .earned(earnedAchievement != null)
                .earnedAt(earnedAchievement == null ? null : earnedAchievement.getEarnedAt())
                .build();
    }

    @Transactional
    public void awardAchievement(Long userId, String code) {
        if (userAchievementRepository.existsByUser_IdAndAchievement_Code(userId, code)) {
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Achievement achievement = achievementRepository.findByCode(code)
                .orElse(null);

        if (achievement == null) {
            return;
        }

        UserAchievement userAchievement = UserAchievement.builder()
                .user(user)
                .achievement(achievement)
                .earnedAt(LocalDateTime.now())
                .build();

        userAchievementRepository.save(userAchievement);
    }
}