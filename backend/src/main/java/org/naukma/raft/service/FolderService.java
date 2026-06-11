package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.FolderRequest;
import org.naukma.raft.dto.response.FolderResponse;
import org.naukma.raft.dto.response.UserSummaryResponse;
import org.naukma.raft.entity.Folder;
import org.naukma.raft.entity.User;
import org.naukma.raft.entity.Workspace;
import org.naukma.raft.errorsHadling.AccessDeniedException;
import org.naukma.raft.errorsHadling.ConflictException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.FolderRepository;
import org.naukma.raft.repository.UserRepository;
import org.naukma.raft.repository.WorkspaceMemberRepository;
import org.naukma.raft.repository.WorkspaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;

    @Transactional(readOnly = true)
    public List<FolderResponse> getFolders(Long userId) {
        Set<Long> workspaceIds = accessibleWorkspaceIds(userId);
        if (workspaceIds.isEmpty()) {
            return List.of();
        }
        return folderRepository.findByWorkspace_IdInOrderByCreatedDesc(workspaceIds)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public FolderResponse createFolder(Long userId, FolderRequest request) {
        User user = getUser(userId);

        Workspace workspace = resolveWorkspace(user, request.getWorkspaceId());

        if (folderRepository.existsByWorkspace_IdAndName(workspace.getId(), request.getName())) {
            throw new ConflictException("Folder with name '" + request.getName() + "' already exists in this workspace");
        }

        Folder folder = Folder.builder()
                .workspace(workspace)
                .name(request.getName())
                .type(request.getType())
                .owner(user)
                .build();

        Folder saved = folderRepository.save(folder);
        return mapToResponse(saved);
    }

    @Transactional
    public FolderResponse updateFolder(Long userId, Long folderId, FolderRequest request) {
        Folder folder = getAccessibleFolder(userId, folderId);

        if (request.getName() != null && !request.getName().equals(folder.getName())) {
            if (folderRepository.existsByWorkspace_IdAndName(folder.getWorkspace().getId(), request.getName())) {
                throw new ConflictException("Folder with name '" + request.getName() + "' already exists in this workspace");
            }
            folder.setName(request.getName());
        }

        Folder updated = folderRepository.save(folder);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteFolder(Long userId, Long folderId) {
        Folder folder = getAccessibleFolder(userId, folderId);
        folderRepository.delete(folder);
    }

    private Set<Long> accessibleWorkspaceIds(Long userId) {
        Set<Long> ids = new LinkedHashSet<>();
        workspaceRepository.findByOwner_Id(userId).forEach(ws -> ids.add(ws.getId()));
        memberRepository.findByUser_Id(userId).forEach(member -> ids.add(member.getWorkspace().getId()));
        return ids;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private Workspace resolveWorkspace(User user, Long workspaceId) {
        if (workspaceId == null) {
            throw new IllegalArgumentException("Workspace ID is required for folder creation");
        }
        Workspace workspace = workspaceRepository.findById(workspaceId).orElseThrow(() -> new NotFoundException("Workspace not found"));
        if (!canAccess(user.getId(), workspace)) {
            throw new AccessDeniedException("You do not have access to this workspace");
        }
        return workspace;
    }

    private Folder getAccessibleFolder(Long userId, Long folderId) {
        Folder folder = folderRepository.findById(folderId).orElseThrow(() -> new NotFoundException("Folder not found"));
        if (!canAccess(userId, folder.getWorkspace())) {
            throw new AccessDeniedException("You do not have access to this folder");
        }
        return folder;
    }

    private boolean canAccess(Long userId, Workspace workspace) {
        return workspace.getOwner().getId().equals(userId) || memberRepository.existsByWorkspace_IdAndUser_Id(workspace.getId(), userId);
    }

    private FolderResponse mapToResponse(Folder folder) {
        Workspace workspace = folder.getWorkspace();
        User owner = folder.getOwner();

        return FolderResponse.builder()
                .id(folder.getId().toString())
                .name(folder.getName())
                .folderType(folder.getType())
                .created(folder.getCreated())
                .workspaceId(workspace.getId().toString())
                .workspaceName(workspace.getName())
                .workspaceColor(workspace.getColor())
                .workspaceType(workspace.getType())
                .owner(UserSummaryResponse.builder()
                        .id(owner.getId().toString())
                        .username(owner.getUsername())
                        .firstName(owner.getFirstName())
                        .lastName(owner.getLastName())
                        .avatar(owner.getAvatar())
                        .build())
                .build();
    }
}