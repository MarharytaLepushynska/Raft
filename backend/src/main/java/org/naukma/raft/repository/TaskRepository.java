package org.naukma.raft.repository;

import org.naukma.raft.entity.Task;
import org.naukma.raft.enums.TaskStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

import java.time.LocalDate;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @EntityGraph(attributePaths = {"workspace", "creator", "assignee"})
    List<Task> findByWorkspace_IdInOrderByCreatedDesc(Collection<Long> workspaceIds);

    void deleteByWorkspace_Id(Long workspaceId);

    @Modifying
    @Query("""
            UPDATE Task t
            SET t.assignee = NULL
            WHERE t.workspace.id = :workspaceId
            AND t.assignee.id = :userId
            """)
    void unassignUserFromTasksInWorkspace(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

    @Query("""
        select count(distinct t)
        from Task t
        where t.creator.id = :userId
        or t.assignee.id = :userId
        """)
    long countUserTasks(@Param("userId") Long userId);

    @Query("""
        select count(distinct t)
        from Task t
        where (t.creator.id = :userId or t.assignee.id = :userId)
        and t.status = :status
        """)
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
    long countDueThisWeekUserTasks(
            @Param("userId") Long userId,
            @Param("today") LocalDate today,
            @Param("weekEnd") LocalDate weekEnd
    );

    long countByAssigneeIdAndStatus(Long userId, TaskStatus status);
}
