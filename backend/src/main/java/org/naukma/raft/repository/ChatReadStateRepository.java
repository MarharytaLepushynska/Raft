package org.naukma.raft.repository;

import org.naukma.raft.entity.ChatReadState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository for accessing chat read state records.
 *
 * Stores and retrieves the last time when a user read a specific workspace chat.
 */
public interface ChatReadStateRepository extends JpaRepository<ChatReadState, Long> {

    /**
     * Finds the read state for a user in a workspace chat.
     *
     * @param workspaceId ID of the workspace chat
     * @param userId ID of the user
     * @return read state, if it exists
     */
    Optional<ChatReadState> findByWorkspace_IdAndUser_Id(Long workspaceId, Long userId);

    /**
     * Deletes all read state records that belong to a workspace.
     *
     * @param workspaceId ID of the workspace
     */
    void deleteByWorkspace_Id(Long workspaceId);

    /**
     * Deletes a read state record for a specific user in a workspace.
     *
     * @param workspaceId ID of the workspace
     * @param userId ID of the user
     */
    void deleteByWorkspace_IdAndUser_Id(Long workspaceId, Long userId);
}