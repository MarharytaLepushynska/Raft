package org.naukma.raft.repository;

import org.naukma.raft.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {
    List<WorkspaceMember> findByUser_Id(Long userId);

    List<WorkspaceMember> findByWorkspace_Id(Long workspaceId);

    Optional<WorkspaceMember> findByWorkspace_IdAndUser_Id(Long workspaceId, Long userId);

    boolean existsByWorkspace_IdAndUser_Id(Long workspaceId, Long userId);

    long countByWorkspace_Id(Long workspaceId);

    @Query("""
            SELECT m.workspace.id, COUNT(m)
            FROM WorkspaceMember m
            WHERE m.workspace.id IN :ids
            GROUP BY m.workspace.id
            """)
    List<Object[]> countByWorkspaceIdIn(Collection<Long> ids);

    void deleteByWorkspace_Id(Long workspaceId);
}
