package org.naukma.raft.repository;

import org.naukma.raft.entity.Expense;
import org.naukma.raft.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository for accessing workspace memberships.
 *
 * Provides methods for finding members by user or workspace,
 * checking membership existence, counting members and deleting workspace members.
 */
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {
    /**
     * Finds all workspace memberships for a user.
     *
     * @param userId ID of the user
     * @return list of workspace membership records
     */
    List<WorkspaceMember> findByUser_Id(Long userId);

    /**
     * Finds all members of a workspace.
     *
     * @param workspaceId ID of the workspace
     * @return list of workspace members
     */
    List<WorkspaceMember> findByWorkspace_Id(Long workspaceId);

    /**
     * Finds a membership record by workspace ID and user ID.
     *
     * @param workspaceId ID of the workspace
     * @param userId ID of the user
     * @return workspace membership, if it exists
     */
    Optional<WorkspaceMember> findByWorkspace_IdAndUser_Id(Long workspaceId, Long userId);

    /**
     * Checks whether a user is a member of a workspace.
     *
     * @param workspaceId ID of the workspace
     * @param userId ID of the user
     * @return true if the user is a workspace member
     */
    boolean existsByWorkspace_IdAndUser_Id(Long workspaceId, Long userId);

    /**
     * Counts members in a workspace.
     *
     * @param workspaceId ID of the workspace
     * @return number of workspace members
     */
    long countByWorkspace_Id(Long workspaceId);

    @Query("""
            SELECT m.workspace.id, COUNT(m)
            FROM WorkspaceMember m
            WHERE m.workspace.id IN :ids
            GROUP BY m.workspace.id
            """)

    /**
     * Counts members for multiple workspaces.
     *
     * Each returned row contains workspace ID and member count.
     *
     * @param ids IDs of workspaces
     * @return list of rows with workspace ID and member count
     */
    List<Object[]> countByWorkspaceIdIn(Collection<Long> ids);

    /**
     * Deletes all membership records that belong to a workspace.
     *
     * @param workspaceId ID of the workspace
     */
    void deleteByWorkspace_Id(Long workspaceId);
}
