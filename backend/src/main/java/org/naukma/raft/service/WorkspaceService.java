package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.MemberRequest;
import org.naukma.raft.dto.request.WorkspaceRequest;
import org.naukma.raft.dto.request.WorkspaceUpdateRequest;
import org.naukma.raft.dto.response.MemberResponse;
import org.naukma.raft.dto.response.WorkspaceDetailResponse;
import org.naukma.raft.dto.response.WorkspaceResponse;
import org.naukma.raft.entity.Task;
import org.naukma.raft.entity.User;
import org.naukma.raft.entity.Workspace;
import org.naukma.raft.entity.WorkspaceMember;
import org.naukma.raft.enums.MemberRole;
import org.naukma.raft.enums.TaskPriority;
import org.naukma.raft.enums.TaskStatus;
import org.naukma.raft.enums.WorkspaceColor;
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

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WorkspaceService {
    private static final WorkspaceColor DEFAULT_COLOR = WorkspaceColor.ROSE;

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public List<WorkspaceResponse> getWorkspaces(Long userId) {
        ensurePersonalWorkspace(userId);

        Map<Long, Workspace> workspaces = new LinkedHashMap<>();
        Map<Long, MemberRole> roles = new LinkedHashMap<>();

        for (Workspace workspace : workspaceRepository.findByOwner_Id(userId)) {
            workspaces.put(workspace.getId(), workspace);
            roles.put(workspace.getId(), MemberRole.ADMIN);
        }
        for (WorkspaceMember member : memberRepository.findByUser_Id(userId)) {
            Workspace workspace = member.getWorkspace();
            if (workspaces.putIfAbsent(workspace.getId(), workspace) == null) {
                roles.put(workspace.getId(), member.getRole());
            }
        }

        Map<Long, Integer> counts = memberCounts(workspaces.keySet());

        return workspaces.values().stream()
                .map(workspace -> toResponse(
                        workspace,
                        roles.get(workspace.getId()),
                        counts.getOrDefault(workspace.getId(), 0)))
                .toList();
    }

    @Transactional
    public void ensurePersonalWorkspace(Long userId) {
        User user = getUser(userId);
        Optional<Workspace> existing = workspaceRepository.findFirstByOwner_IdAndType(userId, WorkspaceType.PERSONAL);
        if (existing.isPresent()) {
            ensureOwnerMembership(existing.get(), user);
            return;
        }
        Workspace personal = createPersonalWorkspace(user);
        taskRepository.save(
                Task.builder()
                        .creator(user)
                        .workspace(personal)
                        .title("Explore Raft")
                        .description("This is your first task — open it to edit, mark it done, or add your own.")
                        .status(TaskStatus.TODO)
                        .priority(TaskPriority.MEDIUM)
                        .dueDate(LocalDate.now())
                        .build()
        );
    }

    @Transactional
    public Workspace getOrCreatePersonalWorkspace(User user) {
        return workspaceRepository.findFirstByOwner_IdAndType(user.getId(), WorkspaceType.PERSONAL)
                .map(workspace -> {
                    ensureOwnerMembership(workspace, user);
                    return workspace;
                })
                .orElseGet(() -> createPersonalWorkspace(user));
    }

    private Workspace createPersonalWorkspace(User user) {
        Workspace personal = workspaceRepository.save(
                Workspace.builder()
                        .name("Personal")
                        .type(WorkspaceType.PERSONAL)
                        .color(WorkspaceColor.YELLOW)
                        .owner(user)
                        .build()
        );
        saveMembership(personal, user, MemberRole.ADMIN);
        return personal;
    }

    @Transactional
    public WorkspaceResponse createWorkspace(Long userId, WorkspaceRequest request) {
        User user = getUser(userId);

        WorkspaceType type = request.getType() != null ? request.getType() : WorkspaceType.SHARED;

        Workspace workspace = workspaceRepository.save(
                Workspace.builder()
                        .name(request.getName().trim())
                        .type(type)
                        .color(resolveColor(request.getColor()))
                        .owner(user)
                        .build()
        );

        saveMembership(workspace, user, MemberRole.ADMIN);

        if (type == WorkspaceType.SHARED && request.getMemberLogins() != null) {
            for (String loginValue : request.getMemberLogins()) {
                if (loginValue == null || loginValue.isBlank()) continue;
                userRepository.findByEmailOrUsername(loginValue.trim(), loginValue.trim()).ifPresent(target -> {
                    boolean alreadyIn = target.getId().equals(user.getId())
                            || memberRepository.existsByWorkspace_IdAndUser_Id(workspace.getId(), target.getId());
                    if (!alreadyIn) {
                        saveMembership(workspace, target, MemberRole.MEMBER);
                    }
                });
            }
        }

        return toResponse(workspace, MemberRole.ADMIN);
    }

    @Transactional(readOnly = true)
    public WorkspaceDetailResponse getWorkspace(Long userId, Long workspaceId) {
        Workspace workspace = getWorkspaceEntity(workspaceId);
        MemberRole role = requireMember(workspace, userId);

        List<MemberResponse> members = memberRepository.findByWorkspace_Id(workspaceId)
                .stream()
                .map(this::toMemberResponse)
                .toList();

        return WorkspaceDetailResponse.builder()
                .id(workspace.getId().toString())
                .name(workspace.getName())
                .type(workspace.getType())
                .color(workspace.getColor())
                .role(role)
                .created(workspace.getCreated())
                .members(members)
                .build();
    }

    @Transactional
    public WorkspaceResponse updateWorkspace(Long userId, Long workspaceId, WorkspaceUpdateRequest request) {
        Workspace workspace = getWorkspaceEntity(workspaceId);
        MemberRole role = requireMember(workspace, userId);
        if (role != MemberRole.ADMIN) {
            throw new AccessDeniedException("Only admins can edit the workspace");
        }
        if (request.getName() != null && !request.getName().isBlank()) {
            workspace.setName(request.getName().trim());
        }
        if (request.getColor() != null) {
            workspace.setColor(request.getColor());
        }
        return toResponse(workspaceRepository.save(workspace), role);
    }

    @Transactional
    public void deleteWorkspace(Long userId, Long workspaceId) {
        Workspace workspace = getWorkspaceEntity(workspaceId);
        if (requireMember(workspace, userId) != MemberRole.ADMIN) {
            throw new AccessDeniedException("Only admins can delete the workspace");
        }
        if (workspace.getType() == WorkspaceType.PERSONAL) {
            throw new ConflictException("You can't delete your personal space");
        }
        taskRepository.deleteByWorkspace_Id(workspaceId);
        memberRepository.deleteByWorkspace_Id(workspaceId);
        workspaceRepository.delete(workspace);
    }

    @Transactional
    public MemberResponse addMember(Long userId, Long workspaceId, MemberRequest request) {
        Workspace workspace = getWorkspaceEntity(workspaceId);
        requireAdmin(workspace, userId);

        User target = userRepository.findByEmailOrUsername(request.getLogin(), request.getLogin())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (workspace.getOwner().getId().equals(target.getId())
                || memberRepository.existsByWorkspace_IdAndUser_Id(workspaceId, target.getId())) {
            throw new ConflictException("User is already a member");
        }

        MemberRole role = request.getRole() != null ? request.getRole() : MemberRole.MEMBER;
        return toMemberResponse(saveMembership(workspace, target, role));
    }

    @Transactional
    public void removeMember(Long userId, Long workspaceId, Long memberUserId) {
        Workspace workspace = getWorkspaceEntity(workspaceId);
        requireAdmin(workspace, userId);

        if (workspace.getOwner().getId().equals(memberUserId)) {
            throw new ConflictException("Cannot remove the workspace owner");
        }

        WorkspaceMember member = memberRepository
                .findByWorkspace_IdAndUser_Id(workspaceId, memberUserId)
                .orElseThrow(() -> new NotFoundException("Member not found"));

        memberRepository.delete(member);
    }

    private Workspace getWorkspaceEntity(Long workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new NotFoundException("Workspace not found"));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private MemberRole requireMember(Workspace workspace, Long userId) {
        if (workspace.getOwner().getId().equals(userId)) {
            return MemberRole.ADMIN;
        }
        return memberRepository.findByWorkspace_IdAndUser_Id(workspace.getId(), userId)
                .map(WorkspaceMember::getRole)
                .orElseThrow(() -> new AccessDeniedException("You do not have access to this workspace"));
    }

    private void requireAdmin(Workspace workspace, Long userId) {
        if (requireMember(workspace, userId) != MemberRole.ADMIN) {
            throw new AccessDeniedException("Only admins can manage members");
        }
    }

    private void ensureOwnerMembership(Workspace workspace, User owner) {
        if (!memberRepository.existsByWorkspace_IdAndUser_Id(workspace.getId(), owner.getId())) {
            saveMembership(workspace, owner, MemberRole.ADMIN);
        }
    }

    private WorkspaceMember saveMembership(Workspace workspace, User user, MemberRole role) {
        return memberRepository.save(
                WorkspaceMember.builder()
                        .workspace(workspace)
                        .user(user)
                        .role(role)
                        .build()
        );
    }

    private WorkspaceResponse toResponse(Workspace workspace, MemberRole role) {
        return toResponse(workspace, role, (int) memberRepository.countByWorkspace_Id(workspace.getId()));
    }

    private WorkspaceResponse toResponse(Workspace workspace, MemberRole role, int memberCount) {
        return WorkspaceResponse.builder()
                .id(workspace.getId().toString())
                .name(workspace.getName())
                .type(workspace.getType())
                .color(workspace.getColor())
                .role(role)
                .memberCount(memberCount)
                .build();
    }

    private Map<Long, Integer> memberCounts(Collection<Long> workspaceIds) {
        Map<Long, Integer> counts = new HashMap<>();
        if (workspaceIds.isEmpty()) {
            return counts;
        }
        for (Object[] row : memberRepository.countByWorkspaceIdIn(workspaceIds)) {
            counts.put((Long) row[0], ((Long) row[1]).intValue());
        }
        return counts;
    }

    private WorkspaceColor resolveColor(WorkspaceColor requested) {
        return requested != null ? requested : DEFAULT_COLOR;
    }

    private MemberResponse toMemberResponse(WorkspaceMember member) {
        User user = member.getUser();
        return MemberResponse.builder()
                .id(member.getId().toString())
                .userId(user.getId().toString())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(member.getRole())
                .build();
    }
}
