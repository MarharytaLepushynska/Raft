package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.FolderPatchRequest;
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

/**
 * Service responsible for managing note folders.
 *
 * Provides CRUD operations for folders and ensures that users can work only
 * with folders from workspaces they own or belong to.
 */
@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;

    /**
     * Returns folders from all workspaces accessible to the user.
     *
     * @param userId ID of the current user
     * @return list of folder responses
     */
    @Transactional(readOnly = true)
    public List<FolderResponse> getFolders(Long userId) {
        Set<Long> workspaceIds = accessibleWorkspaceIds(userId);
        if (workspaceIds.isEmpty()) {
            return List.of();
        }
        return folderRepository.findByWorkspace_IdInOrderByCreatedDesc(workspaceIds)
                .stream()
                .map(folder -> mapToResponse(folder, userId))
                .toList();
    }

    /**
     * Creates a new folder in an accessible workspace.
     *
     * Folder names must be unique within the same workspace.
     *
     * @param userId ID of the current user
     * @param request folder creation data
     * @return created folder response
     */
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
        return mapToResponse(saved, userId);
    }

    /**
     * Updates the folder name if the user has access to it.
     *
     * @param userId ID of the current user
     * @param folderId ID of the folder to update
     * @param request partial folder update data
     * @return updated folder response
     */
    @Transactional
    public FolderResponse updateFolder(Long userId, Long folderId, FolderPatchRequest request) {
        Folder folder = getMutableFolder(userId, folderId);

        if (request.getName() != null && !request.getName().equals(folder.getName())) {
            if (folderRepository.existsByWorkspace_IdAndName(folder.getWorkspace().getId(), request.getName())) {
                throw new ConflictException("Folder with name '" + request.getName() + "' already exists in this workspace");
            }
            folder.setName(request.getName());
        }

        Folder updated = folderRepository.save(folder);
        return mapToResponse(updated, userId);
    }

    /**
     * Deletes a folder if the user has access to it.
     *
     * @param userId ID of the current user
     * @param folderId ID of the folder to delete
     */
    @Transactional
    public void deleteFolder(Long userId, Long folderId) {
        Folder folder = getMutableFolder(userId, folderId);
        folderRepository.delete(folder);
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
        workspaceRepository.findByOwner_Id(userId).forEach(ws -> ids.add(ws.getId()));
        memberRepository.findByUser_Id(userId).forEach(member -> ids.add(member.getWorkspace().getId()));
        return ids;
    }

    /**
     * Finds a user by ID.
     *
     * @param userId ID of the user to find
     * @return found user entity
     */
    private User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
    }

    /**
     * Resolves and validates the workspace where a folder should be created.
     *
     * The workspace ID is required, and the current user must have access
     * to the selected workspace.
     *
     * @param user current user
     * @param workspaceId ID of the selected workspace
     * @return accessible workspace entity
     */
    private Workspace resolveWorkspace(User user, Long workspaceId) {
        if (workspaceId == null) {
            throw new IllegalArgumentException("Workspace ID is required for folder creation");
        }
        Workspace workspace = workspaceRepository.findById(workspaceId).orElseThrow(() -> new NotFoundException("Workspace not found"));
        if (cantAccess(user.getId(), workspace)) {
            throw new AccessDeniedException("You do not have access to this workspace");
        }
        return workspace;
    }

    /**
     * Finds a folder and checks whether the current user can modify it.
     *
     * A folder can be modified by its owner or by the owner of the workspace
     * where the folder belongs.
     *
     * @param userId ID of the current user
     * @param folderId ID of the folder to find
     * @return mutable folder entity
     */
    private Folder getMutableFolder(Long userId, Long folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new NotFoundException("Folder not found"));
        if (cantAccess(userId, folder.getWorkspace())) {
            throw new AccessDeniedException("You do not have access to this folder");
        }

        boolean isOwner = folder.getOwner().getId().equals(userId);
        boolean isWorkspaceOwner = folder.getWorkspace().getOwner().getId().equals(userId);
        if (!isOwner && !isWorkspaceOwner) {
            throw new AccessDeniedException("Only the folder owner can modify this folder");
        }
        return folder;
    }

    /**
     * Checks whether the user cannot access a workspace.
     *
     * Access is denied if the user is neither the workspace owner
     * nor a member of the workspace.
     *
     * @param userId ID of the current user
     * @param workspace workspace to check
     * @return true if the user has no access to the workspace
     */
    private boolean cantAccess(Long userId, Workspace workspace) {
        return !workspace.getOwner().getId().equals(userId) && !memberRepository.existsByWorkspace_IdAndUser_Id(workspace.getId(), userId);
    }

    /**
     * Converts a Folder entity into a FolderResponse DTO.
     *
     * The response includes folder data, workspace metadata, owner summary
     * and a flag showing whether the current user can edit the folder.
     *
     * @param folder folder entity to convert
     * @param userId ID of the current user
     * @return response DTO with folder details
     */
    private FolderResponse mapToResponse(Folder folder, Long userId) {
        Workspace workspace = folder.getWorkspace();
        User owner = folder.getOwner();
        boolean canEdit = folder.getOwner().getId().equals(userId)
                || folder.getWorkspace().getOwner().getId().equals(userId);

        return FolderResponse.builder()
                .id(folder.getId().toString())
                .name(folder.getName())
                .folderType(folder.getType())
                .created(folder.getCreated())
                .workspaceId(workspace.getId().toString())
                .workspaceName(workspace.getName())
                .workspaceColor(workspace.getColor())
                .workspaceType(workspace.getType())
                .canEdit(canEdit)
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