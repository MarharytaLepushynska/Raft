package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.naukma.raft.dto.response.AchievementResponse;
import org.naukma.raft.entity.Achievement;
import org.naukma.raft.entity.UserAchievement;
import org.naukma.raft.entity.User;
import org.naukma.raft.enums.NotificationType;
import org.naukma.raft.enums.TaskStatus;
import org.naukma.raft.enums.WorkspaceType;
import org.naukma.raft.repository.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.naukma.raft.errorsHadling.NotFoundException;

import java.util.List;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseMemberRepository expenseMemberRepository;
    private final NoteRepository noteRepository;
    private final WorkspaceRepository workspaceRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 3 * * *")
    public void checkAllUsers() {
        log.info("Starting daily achievement check");
        List<User> users = userRepository.findAll();
        for (User user : users) {
            checkAchievementsForUser(user);
        }
        log.info("Achievement check completed for {} users", users.size());
    }

    public void checkAchievementsForUser(User user) {
        checkTasksCompleted(user, 10, "TASKS_10");
        checkTasksCompleted(user, 50, "TASKS_50");
        checkExpensesCreated(user, 15, "EXPENSES_15");
        checkWorkspaceCreated(user);
        checkNotesCreated(user, 5, "NOTES_5");
        checkAllSettled(user);
        checkFirstWeek(user);
    }

    private void checkTasksCompleted(User user, int threshold, String code) {
        if (alreadyEarned(user, code)) return;

        long completedCount = taskRepository.countByAssignedToIdAndStatus(user.getId(), TaskStatus.COMPLETED);
        if (completedCount >= threshold) {
            grantAchievement(user, code);
        }
    }

    private void checkExpensesCreated(User user, int threshold, String code) {
        if (alreadyEarned(user, code)) return;

        long count = expenseRepository.countByPaidById(user.getId());
        if (count >= threshold) {
            grantAchievement(user, code);
        }
    }

    private void checkWorkspaceCreated(User user) {
        String code = "WORKSPACE_CREATED";
        if (alreadyEarned(user, code)) return;

        boolean hasSharedWorkspace = workspaceRepository
                .existsByOwnerIdAndType(user.getId(), WorkspaceType.SHARED);
        if (hasSharedWorkspace) {
            grantAchievement(user, code);
        }
    }

    private void checkNotesCreated(User user, int threshold, String code) {
        if (alreadyEarned(user, code)) return;

        long count = noteRepository.countByCreatedById(user.getId());
        if (count >= threshold) {
            grantAchievement(user, code);
        }
    }

    private void checkAllSettled(User user) {
        String code = "ALL_SETTLED";
        if (alreadyEarned(user, code)) return;

        long totalSplits = expenseMemberRepository.countByUser_Id(user.getId());
        long unsettled = expenseMemberRepository.countByUser_IdAndIsSettledFalse(user.getId());

        if (totalSplits > 0 && unsettled == 0) {
            grantAchievement(user, code);
        }
    }

    private void checkFirstWeek(User user) {
        String code = "FIRST_WEEK";
        if (alreadyEarned(user, code)) return;

        if (user.getCreated().isBefore(LocalDateTime.now().minusDays(7))) {
            grantAchievement(user, code);
        }
    }

    private boolean alreadyEarned(User user, String code) {
        return userAchievementRepository
                .findByUser_IdAndAchievement_Code(user.getId(), code)
                .isPresent();
    }

    private void grantAchievement(User user, String code) {
        Achievement achievement = achievementRepository.findByCode(code)
                .orElseThrow(() -> new IllegalStateException("Unknown achievement code: " + code));

        UserAchievement userAchievement = UserAchievement.builder()
                .user(user)
                .achievement(achievement)
                .build();

        userAchievementRepository.save(userAchievement);
        log.info("User {} earned achievement: {}", user.getId(), code);

        notificationService.createNotification(
                user.getId(),
                NotificationType.ACHIEVEMENT,
                "Нова нагорода!",
                "Ви отримали нагороду: " + achievement.getTitle(),
                achievement.getId()
        );
    }

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
