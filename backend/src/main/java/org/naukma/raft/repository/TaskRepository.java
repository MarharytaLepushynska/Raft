package org.naukma.raft.repository;

import org.naukma.raft.entity.Task;
import org.naukma.raft.enums.TaskStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import java.time.LocalDate;

/**
 * Repository for accessing tasks.
 *
 * Provides methods for loading tasks with related workspace and user data,
 * deleting workspace tasks, unassigning users and calculating task statistics.
 */
public interface TaskRepository extends JpaRepository<Task, Long> {

    @EntityGraph(attributePaths = {"workspace", "creator", "assignee"})

    /**
     * Finds tasks from multiple workspaces ordered from newest to oldest.
     *
     * Related workspace, creator and assignee data are loaded together
     * to reduce additional database queries.
     *
     * @param workspaceIds IDs of accessible workspaces
     * @return list of tasks from selected workspaces
     */
    List<Task> findByWorkspace_IdInOrderByCreatedDesc(Collection<Long> workspaceIds);

    /**
     * Deletes all tasks that belong to a workspace.
     *
     * @param workspaceId ID of the workspace
     */
    void deleteByWorkspace_Id(Long workspaceId);

    @Modifying
    @Query("""
            UPDATE Task t
            SET t.assignee = NULL
            WHERE t.workspace.id = :workspaceId
            AND t.assignee.id = :userId
            """)

    /**
     * Removes a user as assignee from all tasks in a workspace.
     *
     * This is used when a member is removed from a workspace.
     *
     * @param workspaceId ID of the workspace
     * @param userId ID of the user to unassign
     */
    void unassignUserFromTasksInWorkspace(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

    @Query("""
        select count(distinct t)
        from Task t
        where t.creator.id = :userId
        or t.assignee.id = :userId
        """)

    /**
     * Counts distinct tasks where the user is either creator or assignee.
     *
     * @param userId ID of the user
     * @return total number of user-related tasks
     */
    long countUserTasks(@Param("userId") Long userId);

    @Query("""
        select count(distinct t)
        from Task t
        where (t.creator.id = :userId or t.assignee.id = :userId)
        and t.status = :status
        """)

    /**
     * Counts distinct user-related tasks with a specific status.
     *
     * @param userId ID of the user
     * @param status task status
     * @return number of tasks with the selected status
     */
    long countUserTasksByStatus(
            @Param("userId") Long userId,
            @Param("status") TaskStatus status
    );

    @Query("""
        select count(distinct t)
        from Task t
        where (t.creator.id = :userId or t.assignee.id = :userId)
        and t.status <> org.naukma.raft.enums.TaskStatus.COMPLETED
        and t.dueDate < :today
        """)

    /**
     * Counts overdue user-related tasks.
     *
     * A task is overdue if it is not completed and its due date is before today.
     *
     * @param userId ID of the user
     * @param today current date
     * @return number of overdue tasks
     */
    long countOverdueUserTasks(
            @Param("userId") Long userId,
            @Param("today") LocalDate today
    );

    @Query("""
        select count(distinct t)
        from Task t
        where (t.creator.id = :userId or t.assignee.id = :userId)
        and t.status <> org.naukma.raft.enums.TaskStatus.COMPLETED
        and t.dueDate = :today
        """)

    /**
     * Counts user-related tasks that are due today.
     *
     * A task is included if the user is either the creator or the assignee,
     * the task is not completed, and its due date is today.
     *
     * @param userId ID of the user
     * @param today current date
     * @return number of user tasks due today
     */
    long countDueTodayUserTasks(
            @Param("userId") Long userId,
            @Param("today") LocalDate today
    );

    @Query("""
        select count(distinct t)
        from Task t
        where (t.creator.id = :userId or t.assignee.id = :userId)
        and t.status <> org.naukma.raft.enums.TaskStatus.COMPLETED
        and t.dueDate between :today and :weekEnd
        """)

    /**
     * Counts user-related tasks that are due during the current week.
     *
     * A task is included if the user is either the creator or the assignee,
     * the task is not completed, and its due date is between today and the end of the week.
     *
     * @param userId ID of the user
     * @param today current date
     * @param weekEnd last date of the current week
     * @return number of user tasks due this week
     */
    long countDueThisWeekUserTasks(
            @Param("userId") Long userId,
            @Param("today") LocalDate today,
            @Param("weekEnd") LocalDate weekEnd
    );

    /**
     * Counts tasks assigned to a specific user with the selected status.
     *
     * This method is used for achievement checks and user statistics,
     * for example to count completed tasks.
     *
     * @param assigneeId ID of the assignee
     * @param status task status to count
     * @return number of assigned tasks with the selected status
     */
    long countByAssignee_IdAndStatus(Long assigneeId, TaskStatus status);

    /**
     * Finds tasks assigned to a user and created after the selected date-time.
     *
     * This method is used for building time-based task statistics.
     *
     * @param userId ID of the assignee
     * @param from start date-time for filtering tasks
     * @return list of assigned tasks created after the selected date-time
     */
    List<Task> findByAssignee_IdAndCreatedAfter(Long userId, LocalDateTime from);

    /**
     * Finds all tasks assigned to a specific user.
     *
     * This method is used when statistics need all assigned tasks,
     * for example to calculate top workspaces by task count.
     *
     * @param userId ID of the assignee
     * @return list of tasks assigned to the user
     */
    List<Task> findByAssignee_Id(Long userId);
}
