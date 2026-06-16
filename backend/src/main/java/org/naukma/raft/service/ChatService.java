package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.ChatMessagePatchRequest;
import org.naukma.raft.dto.request.ChatMessageRequest;
import org.naukma.raft.dto.response.ChatMessageResponse;
import org.naukma.raft.dto.response.UserSummaryResponse;
import org.naukma.raft.dto.response.ChatUnreadCountResponse;
import org.naukma.raft.dto.response.ChatSummaryResponse;
import org.naukma.raft.entity.ChatMessage;
import org.naukma.raft.entity.User;
import org.naukma.raft.entity.Workspace;
import org.naukma.raft.entity.WorkspaceMember;
import org.naukma.raft.entity.ChatReadState;
import org.naukma.raft.enums.MemberRole;
import org.naukma.raft.enums.NotificationType;
import org.naukma.raft.errorsHadling.AccessDeniedException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.ChatMessageRepository;
import org.naukma.raft.repository.UserRepository;
import org.naukma.raft.repository.WorkspaceMemberRepository;
import org.naukma.raft.repository.WorkspaceRepository;
import org.naukma.raft.repository.ChatReadStateRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import java.time.LocalDateTime;

/**
 * Service responsible for workspace chat functionality.
 *
 * Handles sending, reading, updating and deleting messages,
 * tracking unread messages, building chat summaries and creating
 * notifications for new chat messages.
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final ChatReadStateRepository chatReadStateRepository;
    private final NotificationService notificationService;

    /**
     * Returns recent chat messages from a workspace.
     *
     * The user must have access to the workspace. The limit is normalized
     * to avoid returning too many messages at once.
     *
     * @param userId ID of the current user
     * @param workspaceId ID of the workspace chat
     * @param limit maximum number of messages to return
     * @return list of chat message responses ordered from oldest to newest
     */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getWorkspaceMessages(Long userId, Long workspaceId, int limit) {
        Workspace workspace = getWorkspace(workspaceId);
        requireMember(workspace, userId);

        int safeLimit = Math.min(Math.max(limit, 1), 100);

        return chatMessageRepository
                .findByWorkspace_IdOrderByCreatedAtDesc(workspaceId, PageRequest.of(0, safeLimit))
                .stream()
                .sorted(Comparator.comparing(ChatMessage::getCreatedAt))
                .map(message -> mapToResponse(message, userId))
                .toList();
    }

    /**
     * Sends a new message to a workspace chat.
     *
     * The user must be a member of the workspace. After the message is saved,
     * notifications are created for other workspace members.
     *
     * @param userId ID of the message sender
     * @param workspaceId ID of the target workspace
     * @param request message creation request
     * @return created chat message response
     */
    @Transactional
    public ChatMessageResponse sendMessage(Long userId, Long workspaceId, ChatMessageRequest request) {
        Workspace workspace = getWorkspace(workspaceId);
        requireMember(workspace, userId);

        User sender = getUser(userId);

        ChatMessage message = ChatMessage.builder()
                .workspace(workspace)
                .sender(sender)
                .content(request.getContent().trim())
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);

        notifyWorkspaceMembersAboutNewMessage(workspace, sender, savedMessage);

        return mapToResponse(chatMessageRepository.save(message), userId);
    }

    /**
     * Updates an existing chat message.
     *
     * Only the original sender can edit their own message.
     *
     * @param userId ID of the current user
     * @param messageId ID of the message to update
     * @param request message update request
     * @return updated chat message response
     */
    @Transactional
    public ChatMessageResponse updateMessage(Long userId, Long messageId, ChatMessagePatchRequest request) {
        ChatMessage message = getMessage(messageId);

        requireMember(message.getWorkspace(), userId);
        requireSender(message, userId);

        message.setContent(request.getContent().trim());
        message.setEdited(true);

        return mapToResponse(chatMessageRepository.save(message), userId);
    }

    /**
     * Deletes an existing chat message.
     *
     * Only the original sender can delete their own message.
     *
     * @param userId ID of the current user
     * @param messageId ID of the message to delete
     */
    @Transactional
    public void deleteMessage(Long userId, Long messageId) {
        ChatMessage message = getMessage(messageId);

        requireMember(message.getWorkspace(), userId);
        requireSender(message, userId);

        chatMessageRepository.delete(message);
    }

    /**
     * Finds a chat message by ID with related workspace and sender data.
     *
     * Detailed loading is used because the service needs workspace access checks
     * and sender information for response mapping.
     *
     * @param messageId ID of the chat message to find
     * @return found chat message entity
     */
    private ChatMessage getMessage(Long messageId) {
        return chatMessageRepository.findDetailedById(messageId)
                .orElseThrow(() -> new NotFoundException("Chat message not found"));
    }

    /**
     * Finds a workspace by ID.
     *
     * @param workspaceId ID of the workspace to find
     * @return found workspace entity
     */
    private Workspace getWorkspace(Long workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new NotFoundException("Workspace not found"));
    }

    /**
     * Finds a user by ID.
     *
     * @param userId ID of the user to find
     * @return found user entity
     */
    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    /**
     * Checks whether the user has access to a workspace chat.
     *
     * The workspace owner is treated as an admin. Other users must have
     * a workspace membership record. If the user is not allowed to access
     * the workspace, an access denied exception is thrown.
     *
     * @param workspace workspace to check
     * @param userId ID of the current user
     * @return user's role in the workspace
     */
    private MemberRole requireMember(Workspace workspace, Long userId) {
        if (workspace.getOwner().getId().equals(userId)) {
            return MemberRole.ADMIN;
        }

        return memberRepository.findByWorkspace_IdAndUser_Id(workspace.getId(), userId)
                .map(WorkspaceMember::getRole)
                .orElseThrow(() -> new AccessDeniedException("You do not have access to this chat"));
    }

    /**
     * Checks whether the current user is the sender of a chat message.
     *
     * This method is used before editing or deleting a message, because
     * users are allowed to modify only their own chat messages.
     *
     * @param message chat message to check
     * @param userId ID of the current user
     */
    private void requireSender(ChatMessage message, Long userId) {
        if (!message.getSender().getId().equals(userId)) {
            throw new AccessDeniedException("You can edit or delete only your own messages");
        }
    }

    /**
     * Converts a ChatMessage entity into a ChatMessageResponse DTO.
     *
     * The response includes message content, workspace information, sender summary,
     * timestamps and a flag that shows whether the message belongs to the current user.
     *
     * @param message chat message entity to convert
     * @param currentUserId ID of the current user
     * @return chat message response DTO
     */
    private ChatMessageResponse mapToResponse(ChatMessage message, Long currentUserId) {
        Workspace workspace = message.getWorkspace();
        User sender = message.getSender();

        return ChatMessageResponse.builder()
                .id(message.getId().toString())
                .workspaceId(workspace.getId().toString())
                .workspaceName(workspace.getName())
                .sender(toUserSummary(sender))
                .content(message.getContent())
                .edited(message.isEdited())
                .ownMessage(sender.getId().equals(currentUserId))
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .build();
    }

    /**
     * Converts a User entity into a short user summary DTO.
     *
     * This summary is used inside chat responses to show basic sender information
     * without exposing the full user entity.
     *
     * @param user user entity to convert
     * @return short user summary response
     */
    private UserSummaryResponse toUserSummary(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId().toString())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatar(user.getAvatar())
                .build();
    }

    /**
     * Marks a workspace chat as read for the current user.
     *
     * The current time is stored as the last read timestamp.
     *
     * @param userId ID of the current user
     * @param workspaceId ID of the workspace chat
     */
    @Transactional
    public void markWorkspaceAsRead(Long userId, Long workspaceId) {
        Workspace workspace = getWorkspace(workspaceId);
        requireMember(workspace, userId);

        User user = getUser(userId);

        ChatReadState readState = chatReadStateRepository
                .findByWorkspace_IdAndUser_Id(workspaceId, userId)
                .orElseGet(() -> ChatReadState.builder()
                        .workspace(workspace)
                        .user(user)
                        .build());

        readState.setLastReadAt(LocalDateTime.now());

        chatReadStateRepository.save(readState);
    }

    /**
     * Returns unread message counts for all workspaces accessible to the user.
     *
     * @param userId ID of the current user
     * @return list of unread count responses grouped by workspace
     */
    @Transactional(readOnly = true)
    public List<ChatUnreadCountResponse> getUnreadCounts(Long userId) {
        Map<Long, Workspace> workspaces = getAccessibleWorkspaces(userId);

        return workspaces.values()
                .stream()
                .map(workspace -> ChatUnreadCountResponse.builder()
                        .workspaceId(workspace.getId().toString())
                        .workspaceName(workspace.getName())
                        .unreadCount(countUnreadMessages(userId, workspace.getId()))
                        .build())
                .toList();
    }

    /**
     * Counts unread messages in a workspace chat for the current user.
     *
     * If the user has already read this workspace chat before, only messages
     * created after the last read time are counted. The user's own messages
     * are not counted as unread.
     *
     * If there is no read state yet, all messages from other users are counted.
     *
     * @param userId ID of the current user
     * @param workspaceId ID of the workspace chat
     * @return number of unread messages
     */
    private long countUnreadMessages(Long userId, Long workspaceId) {
        return chatReadStateRepository.findByWorkspace_IdAndUser_Id(workspaceId, userId)
                .map(readState -> chatMessageRepository
                        .countByWorkspace_IdAndCreatedAtAfterAndSender_IdNot(
                                workspaceId,
                                readState.getLastReadAt(),
                                userId
                        ))
                .orElseGet(() -> chatMessageRepository
                        .countByWorkspace_IdAndSender_IdNot(workspaceId, userId));
    }

    /**
     * Collects all workspaces accessible to the current user.
     *
     * The result includes workspaces owned by the user and workspaces
     * where the user is added as a member. A map is used to avoid duplicates
     * when the user is both an owner and a member.
     *
     * @param userId ID of the current user
     * @return map of accessible workspace IDs to workspace entities
     */
    private Map<Long, Workspace> getAccessibleWorkspaces(Long userId) {
        Map<Long, Workspace> workspaces = new LinkedHashMap<>();

        for (Workspace workspace : workspaceRepository.findByOwner_Id(userId)) {
            workspaces.put(workspace.getId(), workspace);
        }

        for (WorkspaceMember member : memberRepository.findByUser_Id(userId)) {
            Workspace workspace = member.getWorkspace();
            workspaces.putIfAbsent(workspace.getId(), workspace);
        }

        return workspaces;
    }

    /**
     * Builds chat summaries for all workspaces accessible to the user.
     *
     * Each summary contains workspace data, last message data
     * and unread message count.
     *
     * @param userId ID of the current user
     * @return list of workspace chat summaries
     */
    @Transactional(readOnly = true)
    public List<ChatSummaryResponse> getWorkspaceChatSummaries(Long userId) {
        return getAccessibleWorkspaces(userId)
                .values()
                .stream()
                .map(workspace -> {
                    Optional<ChatMessage> lastMessage =
                            chatMessageRepository.findTopByWorkspace_IdOrderByCreatedAtDesc(workspace.getId());

                    return ChatSummaryResponse.builder()
                            .workspaceId(workspace.getId().toString())
                            .workspaceName(workspace.getName())
                            .lastMessageId(lastMessage
                                    .map(message -> message.getId().toString())
                                    .orElse(null))
                            .lastMessageContent(lastMessage
                                    .map(ChatMessage::getContent)
                                    .orElse(null))
                            .lastMessageSender(lastMessage
                                    .map(message -> toUserSummary(message.getSender()))
                                    .orElse(null))
                            .lastMessageAt(lastMessage
                                    .map(ChatMessage::getCreatedAt)
                                    .orElse(null))
                            .unreadCount(countUnreadMessages(userId, workspace.getId()))
                            .build();
                })
                .sorted(Comparator.comparing(
                        ChatSummaryResponse::getLastMessageAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }

    /**
     * Creates chat message notifications for all workspace members except the sender.
     *
     * The workspace owner is handled separately to avoid duplicate notifications.
     *
     * @param workspace workspace where the message was sent
     * @param sender user who sent the message
     * @param message saved chat message
     */
    private void notifyWorkspaceMembersAboutNewMessage(
            Workspace workspace,
            User sender,
            ChatMessage message
    ) {
        String senderName = buildSenderName(sender);

        String notificationTitle = "New message in " + workspace.getName();
        String notificationMessage = senderName + ": " + shortenMessage(message.getContent());

        Long ownerId = workspace.getOwner().getId();

        if (!ownerId.equals(sender.getId())) {
            notificationService.createNotification(
                    ownerId,
                    NotificationType.CHAT_MESSAGE,
                    notificationTitle,
                    notificationMessage,
                    message.getId()
            );
        }

        memberRepository.findByWorkspace_Id(workspace.getId())
                .stream()
                .map(WorkspaceMember::getUser)
                .filter(user -> !user.getId().equals(sender.getId()))
                .filter(user -> !user.getId().equals(ownerId))
                .forEach(user -> notificationService.createNotification(
                        user.getId(),
                        NotificationType.CHAT_MESSAGE,
                        notificationTitle,
                        notificationMessage,
                        message.getId()
                ));
    }

    /**
     * Builds a display name for the message sender.
     *
     * First name is preferred, then username. If neither is available,
     * a generic name is returned.
     *
     * @param sender message sender
     * @return sender display name
     */
    private String buildSenderName(User sender) {
        if (sender.getFirstName() != null && !sender.getFirstName().isBlank()) {
            return sender.getFirstName();
        }

        if (sender.getUsername() != null && !sender.getUsername().isBlank()) {
            return sender.getUsername();
        }

        return "Someone";
    }

    /**
     * Shortens long chat messages for notification previews.
     *
     * @param content original message content
     * @return shortened message preview
     */
    private String shortenMessage(String content) {
        if (content.length() <= 80) {
            return content;
        }

        return content.substring(0, 77) + "...";
    }
}