package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.TaskPatchRequest;
import org.naukma.raft.dto.request.TaskRequest;
import org.naukma.raft.dto.response.TaskResponse;
import org.naukma.raft.dto.response.UserSummaryResponse;
import org.naukma.raft.entity.Task;
import org.naukma.raft.entity.User;
import org.naukma.raft.entity.Workspace;
import org.naukma.raft.enums.TaskStatus;
import org.naukma.raft.enums.WorkspaceType;
import org.naukma.raft.errorsHadling.AccessDeniedException;
import org.naukma.raft.errorsHadling.ConflictException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.TaskRepository;
import org.naukma.raft.repository.UserRepository;
import org.naukma.raft.repository.WorkspaceMemberRepository;
import org.naukma.raft.repository.WorkspaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Service responsible for task management.
 *
 * Handles task CRUD operations, workspace access checks, assignee validation
 * and task-related achievements.
 */
@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final WorkspaceService workspaceService;
    private final AchievementService achievementService;

    /**
     * Returns tasks from all workspaces accessible to the user.
     *
     * @param userId ID of the current user
     * @return list of task responses
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(Long userId) {
        Set<Long> workspaceIds = accessibleWorkspaceIds(userId);
        if (workspaceIds.isEmpty()) {
            return List.of();
        }
        return taskRepository.findByWorkspace_IdInOrderByCreatedDesc(workspaceIds)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Creates a new task in a personal or selected workspace.
     *
     * If the task is created in a personal workspace and no assignee is provided,
     * the creator is assigned automatically.
     *
     * @param userId ID of the current user
     * @param request task creation data
     * @return created task response
     */
    @Transactional
    public TaskResponse createTask(Long userId, TaskRequest request) {
        User user = getUser(userId);
        Workspace workspace = resolveWorkspace(user, request.getWorkspaceId());

        User assignee = resolveAssignee(workspace, request.getAssigneeId());
        if (assignee == null && workspace.getType() == WorkspaceType.PERSONAL) {
            assignee = user;
        }

        Task task = Task.builder()
                .creator(user)
                .workspace(workspace)
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(request.getStatus())
                .dueDate(request.getDueDate())
                .dueTime(request.getDueTime())
                .assignee(assignee)
                .build();

        Task savedTask = taskRepository.save(task);

        achievementService.awardAchievement(userId, "FIRST_TASK_CREATED");

        if (savedTask.getStatus() == TaskStatus.COMPLETED) {
            achievementService.awardAchievement(userId, "FIRST_TASK_COMPLETED");
        }

        return mapToResponse(savedTask);
    }

    /**
     * Updates an existing task if the user has access to its workspace.
     *
     * If the task becomes completed, the corresponding achievement can be granted.
     *
     * @param userId ID of the current user
     * @param taskId ID of the task to update
     * @param request partial task update data
     * @return updated task response
     */
    @Transactional
    public TaskResponse updateTask(Long userId, Long taskId, TaskPatchRequest request) {
        Task task = getAccessibleTask(userId, taskId);
        boolean wasCompleted = task.getStatus() == TaskStatus.COMPLETED;

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getDueTime() != null) task.setDueTime(request.getDueTime());
        if (request.getAssigneeId() != null) {
            task.setAssignee(request.getAssigneeId() == 0
                    ? null
                    : resolveAssignee(task.getWorkspace(), request.getAssigneeId()));
        }

        Task savedTask = taskRepository.save(task);

        if (!wasCompleted && savedTask.getStatus() == TaskStatus.COMPLETED) {
            achievementService.awardAchievement(userId, "FIRST_TASK_COMPLETED");
        }

        return mapToResponse(savedTask);
    }

    /**
     * Deletes a task if the user has access to its workspace.
     *
     * @param userId ID of the current user
     * @param taskId ID of the task to delete
     */
    @Transactional
    public void deleteTask(Long userId, Long taskId) {
        Task task = getAccessibleTask(userId, taskId);
        taskRepository.delete(task);
    }

    /**
     * Resolves the workspace where a task should be created.
     *
     * If no workspace ID is provided, the user's personal workspace is used.
     *
     * @param user current user
     * @param workspaceId optional workspace ID
     * @return resolved workspace
     */
    private Workspace resolveWorkspace(User user, Long workspaceId) {
        if (workspaceId == null) {
            return workspaceService.getOrCreatePersonalWorkspace(user);
        }
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new NotFoundException("Workspace not found"));
        if (!canAccess(user.getId(), workspace)) {
            throw new AccessDeniedException("You do not have access to this workspace");
        }
        return workspace;
    }

    /**
     * Finds a task and checks whether the current user has access to it.
     *
     * Access is allowed if the user owns the workspace
     * or is a member of that workspace.
     *
     * @param userId ID of the current user
     * @param taskId ID of the task to find
     * @return accessible task entity
     */
    private Task getAccessibleTask(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));
        if (!canAccess(userId, task.getWorkspace())) {
            throw new AccessDeniedException("You do not have access to this task");
        }
        return task;
    }

    /**
     * Resolves and validates task assignee.
     *
     * The assignee must exist and must have access to the task workspace.
     *
     * @param workspace task workspace
     * @param assigneeId optional assignee ID
     * @return assignee user or null
     */
    private User resolveAssignee(Workspace workspace, Long assigneeId) {
        if (assigneeId == null || assigneeId == 0) {
            return null;
        }
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new NotFoundException("Assignee not found"));
        if (!canAccess(assignee.getId(), workspace)) {
            throw new ConflictException("Assignee is not a member of this workspace");
        }
        return assignee;
    }

    /**
     * Checks whether a user has access to a workspace.
     *
     * A user has access if they are the workspace owner
     * or a member of that workspace.
     *
     * @param userId ID of the current user
     * @param workspace workspace to check
     * @return true if the user can access the workspace
     */
    private boolean canAccess(Long userId, Workspace workspace) {
        return workspace.getOwner().getId().equals(userId)
                || memberRepository.existsByWorkspace_IdAndUser_Id(workspace.getId(), userId);
    }

    /**
     * Collects IDs of all workspaces available to the current user.
     *
     * The result includes workspaces owned by the user and workspaces
     * where the user is a member.
     *
     * @param userId ID of the current user
     * @return set of accessible workspace IDs
     */
    private Set<Long> accessibleWorkspaceIds(Long userId) {
        Set<Long> ids = new LinkedHashSet<>();
        workspaceRepository.findByOwner_Id(userId).forEach(w -> ids.add(w.getId()));
        memberRepository.findByUser_Id(userId).forEach(m -> ids.add(m.getWorkspace().getId()));
        return ids;
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
     * Converts a Task entity into a TaskResponse DTO.
     *
     * The response includes task details, workspace metadata,
     * creator summary and assignee summary.
     *
     * @param task task entity to convert
     * @return task response DTO
     */
    private TaskResponse mapToResponse(Task task) {
        Workspace workspace = task.getWorkspace();
        return TaskResponse.builder()
                .id(task.getId().toString())
                .title(task.getTitle())
                .description(task.getDescription())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .dueTime(task.getDueTime())
                .status(task.getStatus())
                .created(task.getCreated())
                .workspaceId(workspace.getId().toString())
                .workspaceName(workspace.getName())
                .workspaceColor(workspace.getColor())
                .workspaceType(workspace.getType())
                .creator(toUserSummary(task.getCreator()))
                .assignee(toUserSummary(task.getAssignee()))
                .build();
    }

    /**
     * Converts a User entity into a short user summary DTO.
     *
     * Returns null if the user is not assigned.
     *
     * @param user user entity to convert
     * @return short user summary response or null
     */
    private UserSummaryResponse toUserSummary(User user) {
        if (user == null) {
            return null;
        }
        return UserSummaryResponse.builder()
                .id(user.getId().toString())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatar(user.getAvatar())
                .build();
    }
}
