package org.naukma.raft.repository;

import org.naukma.raft.entity.Workspace;
import org.naukma.raft.enums.WorkspaceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for accessing workspaces.
 *
 * Provides methods for finding personal workspaces, owner workspaces
 * and checking whether a user already has a workspace of a specific type.
 */
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    /**
     * Finds the first workspace owned by a user with the selected type.
     *
     * Usually used to find the user's personal workspace.
     *
     * @param ownerId ID of the workspace owner
     * @param type workspace type
     * @return workspace, if it exists
     */
    Optional<Workspace> findFirstByOwner_IdAndType(Long ownerId, WorkspaceType type);

    /**
     * Finds all workspaces owned by a specific user.
     *
     * @param ownerId ID of the workspace owner
     * @return list of owned workspaces
     */
    List<Workspace> findByOwner_Id(Long ownerId);

    /**
     * Checks whether a user owns a workspace of the selected type.
     *
     * @param ownerId ID of the workspace owner
     * @param type workspace type
     * @return true if such workspace exists
     */
    boolean existsByOwner_IdAndType(Long ownerId, WorkspaceType type);
}
