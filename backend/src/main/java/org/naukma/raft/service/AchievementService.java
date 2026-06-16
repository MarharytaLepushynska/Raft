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

import java.time.ZoneId;
import java.util.List;

import java.time.LocalDateTime;

/**
 * Service responsible for checking, granting and returning user achievements.
 *
 * This service periodically checks all users and verifies whether they meet
 * the conditions for achievements related to completed tasks, created expenses,
 * shared workspaces, notes, settled expenses and account age.
 */
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

    /**
     * Periodically checks all users for newly earned achievements.
     *
     * This method is executed automatically by Spring Scheduler.
     */
    @Scheduled(fixedRate = 15000)
    public void checkAllUsers() {
        log.info("Starting daily achievement check");
        List<User> users = userRepository.findAll();
        for (User user : users) {
            checkAchievementsForUser(user);
        }
        log.info("Achievement check completed for {} users", users.size());
    }

    /**
     * Runs all achievement checks for a specific user.
     *
     * @param user user whose progress should be checked
     */
    public void checkAchievementsForUser(User user) {
        checkTasksCompleted(user, 10, "TASKS_10");
        checkTasksCompleted(user, 50, "TASKS_50");
        checkExpensesCreated(user, 15, "EXPENSES_15");
        checkWorkspaceCreated(user);
        checkNotesCreated(user, 5, "NOTES_5");
        checkAllSettled(user);
        checkFirstWeek(user);
    }

    /**
     * Checks whether the user has completed at least the required number of tasks.
     *
     * @param user user being checked
     * @param threshold required number of completed tasks
     * @param code achievement code to grant if the condition is met
     */
    private void checkTasksCompleted(User user, int threshold, String code) {
        if (alreadyEarned(user, code)) return;

        long completedCount = taskRepository.countByAssignee_IdAndStatus(user.getId(), TaskStatus.COMPLETED);
        System.out.println("User " + user.getId() + " completed tasks: " + completedCount + ", threshold: " + threshold);

        if (completedCount >= threshold) {
            grantAchievement(user, code);
        }
    }

    /**
     * Checks whether the user has created at least the required number of expenses.
     *
     * @param user user being checked
     * @param threshold required number of created expenses
     * @param code achievement code to grant if the condition is met
     */
    private void checkExpensesCreated(User user, int threshold, String code) {
        if (alreadyEarned(user, code)) return;

        long count = expenseRepository.countByPaidById(user.getId());
        if (count >= threshold) {
            grantAchievement(user, code);
        }
    }

    /**
     * Checks whether the user has created at least one shared workspace.
     *
     * @param user user being checked
     */
    private void checkWorkspaceCreated(User user) {
        String code = "WORKSPACE_CREATED";
        if (alreadyEarned(user, code)) return;

        boolean hasSharedWorkspace = workspaceRepository
                .existsByOwner_IdAndType(user.getId(), WorkspaceType.SHARED);
        if (hasSharedWorkspace) {
            grantAchievement(user, code);
        }
    }

    /**
     * Checks whether the user has created at least the required number of notes.
     *
     * @param user user being checked
     * @param threshold required number of created notes
     * @param code achievement code to grant if the condition is met
     */
    private void checkNotesCreated(User user, int threshold, String code) {
        if (alreadyEarned(user, code)) return;

        long count = noteRepository.countByCreator_Id(user.getId());
        if (count >= threshold) {
            grantAchievement(user, code);
        }
    }

    /**
     * Checks whether all expense splits assigned to the user are settled.
     *
     * The achievement is granted only if the user has at least one split
     * and none of them remain unsettled.
     *
     * @param user user being checked
     */
    private void checkAllSettled(User user) {
        String code = "ALL_SETTLED";
        if (alreadyEarned(user, code)) return;

        long totalSplits = expenseMemberRepository.countByUser_Id(user.getId());
        long unsettled = expenseMemberRepository.countByUser_IdAndIsSettledFalse(user.getId());

        if (totalSplits > 0 && unsettled == 0) {
            grantAchievement(user, code);
        }
    }

    /**
     * Checks whether the user's account is older than one week.
     *
     * @param user user being checked
     */
    private void checkFirstWeek(User user) {
        String code = "FIRST_WEEK";
        if (alreadyEarned(user, code)) return;

        if (user.getCreated().isBefore(LocalDateTime.now(ZoneId.of("Europe/Kyiv")).minusDays(7))) {
            grantAchievement(user, code);
        }
    }

    /**
     * Checks whether the user has already earned the achievement with the given code.
     *
     * @param user user being checked
     * @param code achievement code
     * @return true if the achievement has already been earned
     */
    private boolean alreadyEarned(User user, String code) {
        return userAchievementRepository
                .findByUser_IdAndAchievement_Code(user.getId(), code)
                .isPresent();
    }

    /**
     * Grants an achievement to the user and creates an achievement notification.
     *
     * @param user user who earned the achievement
     * @param code achievement code
     */
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

    /**
     * Returns all available achievements and marks which of them were earned by the user.
     *
     * @param userId ID of the current user
     * @return list of all achievements with earned status
     */
    @Transactional(readOnly = true)
    public List<AchievementResponse> getAchievements(Long userId) {
        List<UserAchievement> earnedAchievements =
                userAchievementRepository.findByUser_IdOrderByEarnedAtDesc(userId);

        return achievementRepository.findAll()
                .stream()
                .map(achievement -> mapToResponse(achievement, earnedAchievements))
                .toList();
    }

    /**
     * Returns only achievements already earned by the user.
     *
     * @param userId ID of the current user
     * @return list of earned achievements
     */
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

    /**
     * Converts an achievement entity into a response DTO and adds earned metadata.
     *
     * @param achievement achievement entity
     * @param earnedAchievements list of achievements earned by the user
     * @return response DTO for the achievement
     */
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

    /**
     * Grants a specific achievement to a user if it exists and was not earned before.
     *
     * This method is used by other services when a specific action should immediately
     * unlock an achievement, for example creating the first task or workspace.
     *
     * @param userId ID of the user
     * @param code achievement code
     */
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
                .earnedAt(LocalDateTime.now(ZoneId.of("Europe/Kyiv")))
                .build();

        userAchievementRepository.save(userAchievement);
    }
}
