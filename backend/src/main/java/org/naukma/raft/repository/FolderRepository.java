package org.naukma.raft.repository;

import org.naukma.raft.entity.Folder;
import org.naukma.raft.enums.FolderType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository for accessing note folders.
 *
 * Provides methods for retrieving folders by workspace, filtering by folder type,
 * checking name uniqueness and deleting folders when a workspace is removed.
 */
public interface FolderRepository extends JpaRepository<Folder, Long> {
    /**
     * Finds folders from multiple workspaces ordered from newest to oldest.
     *
     * @param workspaceIds IDs of workspaces
     * @return list of folders from the selected workspaces
     */
    List<Folder> findByWorkspace_IdInOrderByCreatedDesc(Collection<Long> workspaceIds);

    /**
     * Finds folders from a specific workspace ordered from newest to oldest.
     *
     * @param workspaceId ID of the workspace
     * @return list of workspace folders
     */
    List<Folder> findByWorkspace_IdOrderByCreatedDesc(Long workspaceId);

    /**
     * Finds folders of a specific type in a workspace.
     *
     * @param workspaceId ID of the workspace
     * @param type folder type
     * @return list of folders with the selected type
     */
    List<Folder> findByWorkspace_IdAndTypeOrderByCreatedDesc(Long workspaceId, FolderType type);

    /**
     * Checks whether a folder with the same name already exists in a workspace.
     *
     * @param workspaceId ID of the workspace
     * @param name folder name
     * @return true if a folder with this name already exists
     */
    boolean existsByWorkspace_IdAndName(Long workspaceId, String name);

    /**
     * Finds a folder by ID only if it belongs to the selected workspace.
     *
     * @param id folder ID
     * @param workspaceId workspace ID
     * @return folder, if it exists in the workspace
     */
    Optional<Folder> findByIdAndWorkspace_Id(Long id, Long workspaceId);

    /**
     * Deletes all folders that belong to a workspace.
     *
     * @param workspaceId ID of the workspace
     */
    void deleteByWorkspace_Id(Long workspaceId);
}