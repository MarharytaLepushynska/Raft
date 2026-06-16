package org.naukma.raft.repository;

import org.naukma.raft.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

import java.time.LocalDateTime;

/**
 * Repository for accessing workspace chat messages.
 *
 * Provides methods for loading messages with related workspace and sender data,
 * finding the last message in a workspace, counting unread messages
 * and deleting chat messages when a workspace is removed.
 */
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Finds recent messages from a workspace ordered from newest to oldest.
     *
     * Related workspace and sender data are loaded together to avoid extra queries.
     *
     * @param workspaceId ID of the workspace chat
     * @param pageable pagination and limit settings
     * @return list of chat messages
     */
    @EntityGraph(attributePaths = {"workspace", "sender"})
    List<ChatMessage> findByWorkspace_IdOrderByCreatedAtDesc(Long workspaceId, Pageable pageable);

    /**
     * Finds the latest message in a workspace chat.
     *
     * @param workspaceId ID of the workspace chat
     * @return latest chat message, if it exists
     */
    @EntityGraph(attributePaths = {"workspace", "sender"})
    Optional<ChatMessage> findTopByWorkspace_IdOrderByCreatedAtDesc(Long workspaceId);

    /**
     * Finds a chat message with related workspace and sender data.
     *
     * @param id ID of the chat message
     * @return detailed chat message, if it exists
     */
    @EntityGraph(attributePaths = {"workspace", "sender"})
    @Query("select m from ChatMessage m where m.id = :id")
    Optional<ChatMessage> findDetailedById(@Param("id") Long id);

    /**
     * Deletes all chat messages that belong to a workspace.
     *
     * @param workspaceId ID of the workspace
     */
    void deleteByWorkspace_Id(Long workspaceId);

    /**
     * Counts all messages in a workspace written by users other than the current user.
     *
     * @param workspaceId ID of the workspace chat
     * @param senderId ID of the current user
     * @return number of messages written by other users
     */
    long countByWorkspace_IdAndSender_IdNot(Long workspaceId, Long senderId);

    /**
     * Counts messages created after the selected time and written by other users.
     *
     * Used for calculating unread message counts.
     *
     * @param workspaceId ID of the workspace chat
     * @param createdAt last read time
     * @param senderId ID of the current user
     * @return number of unread messages
     */
    long countByWorkspace_IdAndCreatedAtAfterAndSender_IdNot(
            Long workspaceId,
            LocalDateTime createdAt,
            Long senderId
    );
}