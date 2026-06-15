package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.response.ProductivityStatisticsResponse;
import org.naukma.raft.dto.response.stats.ChartPointResponse;
import org.naukma.raft.dto.response.stats.StatisticsResponse;
import org.naukma.raft.dto.response.stats.WorkspaceTaskCountResponse;
import org.naukma.raft.entity.ExpenseMember;
import org.naukma.raft.entity.Task;
import org.naukma.raft.entity.Workspace;
import org.naukma.raft.enums.StatsPeriod;
import org.naukma.raft.enums.TaskStatus;
import org.naukma.raft.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final TaskRepository taskRepository;
    private final ReminderRepository reminderRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final AchievementRepository achievementRepository;
    private final NotificationRepository notificationRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseMemberRepository expenseMemberRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

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

    public StatisticsResponse getStatistics(Long userId, StatsPeriod period) {
        LocalDateTime from = getFromDate(period);

        return StatisticsResponse.builder()
                .taskStats(getTaskStats(userId, period, from))
                .expenseStats(getExpenseStats(userId, period, from))
                .topWorkspaces(getTopWorkspaces(userId))
                .build();
    }

    private LocalDateTime getFromDate(StatsPeriod period) {
        LocalDate today = LocalDate.now();

        return switch (period) {
            case WEEK -> today.minusDays(6).atStartOfDay();
            case MONTH -> today.minusWeeks(4).withDayOfMonth(1).atStartOfDay();
            case YEAR -> today.minusMonths(11).withDayOfMonth(1).atStartOfDay();
        };
    }

    private List<ChartPointResponse> getTaskStats(Long userId, StatsPeriod period, LocalDateTime from) {
        List<Task> tasks = taskRepository.findByAssignee_IdAndCreatedAfter(userId, from);

        Map<String, Long> grouped = tasks.stream()
                .collect(Collectors.groupingBy(
                        t -> bucketLabel(t.getCreated(), period),
                        Collectors.counting()
                ));

        return buildBuckets(period).stream()
                .map(label -> ChartPointResponse.builder()
                        .label(label)
                        .count(grouped.getOrDefault(label, 0L))
                        .build())
                .toList();
    }

    private List<ChartPointResponse> getExpenseStats(Long userId, StatsPeriod period, LocalDateTime from) {
        List<ExpenseMember> myShares = expenseMemberRepository.findByUser_Id(userId)
                .stream()
                .filter(s -> s.getExpense().getCreatedAt().isAfter(from))
                .toList();

        Map<String, BigDecimal> grouped = myShares.stream()
                .collect(Collectors.groupingBy(
                        s -> bucketLabel(s.getExpense().getCreatedAt(), period),
                        Collectors.reducing(BigDecimal.ZERO, ExpenseMember::getShare, BigDecimal::add)
                ));

        Map<String, Long> countGrouped = myShares.stream()
                .collect(Collectors.groupingBy(
                        s -> bucketLabel(s.getExpense().getCreatedAt(), period),
                        Collectors.counting()
                ));

        return buildBuckets(period).stream()
                .map(label -> ChartPointResponse.builder()
                        .label(label)
                        .count(countGrouped.getOrDefault(label, 0L))
                        .amount(grouped.getOrDefault(label, BigDecimal.ZERO))
                        .build())
                .toList();
    }

    private List<WorkspaceTaskCountResponse> getTopWorkspaces(Long userId) {
        List<Task> tasks = taskRepository.findByAssignee_Id(userId);

        Map<Long, List<Task>> byWorkspace = tasks.stream()
                .collect(Collectors.groupingBy(t -> t.getWorkspace().getId()));

        return byWorkspace.entrySet().stream()
                .map(entry -> {
                    Workspace ws = entry.getValue().get(0).getWorkspace();
                    return WorkspaceTaskCountResponse.builder()
                            .workspaceId(ws.getId())
                            .workspaceName(ws.getName())
                            .taskCount((long) entry.getValue().size())
                            .build();
                })
                .sorted(Comparator.comparingLong(WorkspaceTaskCountResponse::getTaskCount).reversed())
                .limit(3)
                .toList();
    }

    private String bucketLabel(LocalDateTime date, StatsPeriod period) {
        return switch (period) {
            case WEEK -> date.getDayOfWeek()
                    .getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            case MONTH -> "Week " + ((date.getDayOfMonth() - 1) / 7 + 1);
            case YEAR -> date.getMonth()
                    .getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
        };
    }

    private List<String> buildBuckets(StatsPeriod period) {
        LocalDate today = LocalDate.now();
        return switch (period) {
            case WEEK -> {
                List<String> days = new ArrayList<>();
                for (int i = 6; i >= 0; i--) {
                    days.add(today.minusDays(i).getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                }
                yield days;
            }
            case MONTH -> List.of("Week 1", "Week 2", "Week 3", "Week 4", "Week 5");
            case YEAR -> {
                List<String> months = new ArrayList<>();
                for(int i = 11; i >= 0; i--) {
                    months.add(today.minusMonths(i).getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                }
                yield months;
            }
        };
    }
}
