package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.TaskPatchRequest;
import org.naukma.raft.dto.request.TaskRequest;
import org.naukma.raft.dto.response.TaskResponse;
import org.naukma.raft.entity.Task;
import org.naukma.raft.entity.User;
import org.naukma.raft.entity.Workspace;
import org.naukma.raft.enums.WorkspaceType;
import org.naukma.raft.errorsHadling.AccessDeniedException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.TaskRepository;
import org.naukma.raft.repository.UserRepository;
import org.naukma.raft.repository.WorkspaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(Long userId) {
        return taskRepository
                .findByCreator_IdOrderByCreatedDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public TaskResponse createTask(Long userId, TaskRequest request) {
        User user = getUser(userId);
        Workspace workspace = getOrCreatePersonalWorkspace(user);

        Task task = Task.builder()
                .creator(user)
                .workspace(workspace)
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(request.getStatus())
                .dueDate(request.getDueDate())
                .dueTime(request.getDueTime())
                .build();

        return mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(Long userId, Long taskId, TaskPatchRequest request) {
        Task task = getOwnedTask(userId, taskId);

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getDueTime() != null) task.setDueTime(request.getDueTime());

        return mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(Long userId, Long taskId) {
        Task task = getOwnedTask(userId, taskId);
        taskRepository.delete(task);
    }

    private Task getOwnedTask(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new NotFoundException("Task not found"));

        if (!task.getCreator().getId().equals(userId)) {
            throw new AccessDeniedException("You do not have access to this task");
        }
        return task;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private Workspace getOrCreatePersonalWorkspace(User user) {
        return workspaceRepository
                .findFirstByOwner_IdAndType(user.getId(), WorkspaceType.PERSONAL)
                .orElseGet(() -> workspaceRepository.save(
                        Workspace.builder()
                                .name("Personal")
                                .type(WorkspaceType.PERSONAL)
                                .owner(user)
                                .build()
                ));
    }

    private TaskResponse mapToResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId().toString())
                .title(task.getTitle())
                .description(task.getDescription())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .dueTime(task.getDueTime())
                .status(task.getStatus())
                .build();
    }
}
