package org.naukma.raft.repository;

import org.naukma.raft.entity.Task;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

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
}
