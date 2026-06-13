package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.response.ProductivityStatisticsResponse;
import org.naukma.raft.enums.TaskStatus;
import org.naukma.raft.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public ProductivityStatisticsResponse getProductivityStatistics(Long userId) {
        long totalTasks = taskRepository.countUserTasks(userId);
        long todoTasks = taskRepository.countUserTasksByStatus(userId, TaskStatus.TODO);
        long inProgressTasks = taskRepository.countUserTasksByStatus(userId, TaskStatus.IN_PROGRESS);
        long completedTasks = taskRepository.countUserTasksByStatus(userId, TaskStatus.COMPLETED);
        long overdueTasks = taskRepository.countOverdueUserTasks(userId, LocalDate.now());

        double completionRate = calculateCompletionRate(totalTasks, completedTasks);

        return ProductivityStatisticsResponse.builder()
                .totalTasks(totalTasks)
                .todoTasks(todoTasks)
                .inProgressTasks(inProgressTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .completionRate(completionRate)
                .build();
    }

    private double calculateCompletionRate(long totalTasks, long completedTasks) {
        if (totalTasks == 0) {
            return 0.0;
        }

        return Math.round(((double) completedTasks / totalTasks) * 1000.0) / 10.0;
    }
}