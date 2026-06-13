package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.response.ProductivityStatisticsResponse;
import org.naukma.raft.enums.TaskStatus;
import org.naukma.raft.repository.AchievementRepository;
import org.naukma.raft.repository.NotificationRepository;
import org.naukma.raft.repository.ReminderRepository;
import org.naukma.raft.repository.TaskRepository;
import org.naukma.raft.repository.UserAchievementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final TaskRepository taskRepository;
    private final ReminderRepository reminderRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final AchievementRepository achievementRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public ProductivityStatisticsResponse getProductivityStatistics(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate weekEnd = today.plusDays(6);

        long totalTasks = taskRepository.countUserTasks(userId);
        long todoTasks = taskRepository.countUserTasksByStatus(userId, TaskStatus.TODO);
        long inProgressTasks = taskRepository.countUserTasksByStatus(userId, TaskStatus.IN_PROGRESS);
        long completedTasks = taskRepository.countUserTasksByStatus(userId, TaskStatus.COMPLETED);
        long overdueTasks = taskRepository.countOverdueUserTasks(userId, today);
        long dueTodayTasks = taskRepository.countDueTodayUserTasks(userId, today);
        long dueThisWeekTasks = taskRepository.countDueThisWeekUserTasks(userId, today, weekEnd);

        long upcomingReminders = reminderRepository.countUpcomingUserReminders(userId, LocalDateTime.now());

        long earnedAchievements = userAchievementRepository.countByUser_Id(userId);
        long totalAchievements = achievementRepository.count();

        long unreadNotifications = notificationRepository.countByUser_IdAndReadFalse(userId);

        double completionRate = calculateRate(completedTasks, totalTasks);
        double achievementRate = calculateRate(earnedAchievements, totalAchievements);

        return ProductivityStatisticsResponse.builder()
                .totalTasks(totalTasks)
                .todoTasks(todoTasks)
                .inProgressTasks(inProgressTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .dueTodayTasks(dueTodayTasks)
                .dueThisWeekTasks(dueThisWeekTasks)
                .completionRate(completionRate)
                .upcomingReminders(upcomingReminders)
                .earnedAchievements(earnedAchievements)
                .totalAchievements(totalAchievements)
                .achievementRate(achievementRate)
                .unreadNotifications(unreadNotifications)
                .build();
    }

    private double calculateRate(long part, long total) {
        if (total == 0) {
            return 0.0;
        }

        return Math.round(((double) part / total) * 1000.0) / 10.0;
    }
}