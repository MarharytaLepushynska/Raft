package org.naukma.raft.repository;

import org.naukma.raft.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;

/**
 * Repository for accessing notes.
 *
 * Provides methods for retrieving notes by folder, searching notes by content,
 * counting notes and deleting notes when a folder is removed.
 */
public interface NoteRepository extends JpaRepository<Note, Long> {
    /**
     * Finds notes from a folder ordered by last update time.
     *
     * @param folderId ID of the folder
     * @return list of notes ordered from recently updated to oldest
     */
    List<Note> findByFolder_IdOrderByUpdatedAtDesc(Long folderId);

    /**
     * Finds notes from multiple folders ordered by last update time.
     *
     * @param folderIds IDs of accessible folders
     * @return list of notes from the selected folders
     */
    List<Note> findByFolder_IdInOrderByUpdatedAtDesc(Collection<Long> folderIds);

    @Query("""
        SELECT n FROM Note n
        WHERE LOWER(n.title) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(n.content) LIKE LOWER(CONCAT('%', :query, '%'))
        """)

    /**
     * Searches notes by title or content.
     *
     * The search is case-insensitive and limited by the provided pageable object.
     *
     * @param query search query
     * @param pageable pagination and limit settings
     * @return list of matching notes
     */
    List<Note> searchByTitleOrContent(@Param("query") String query, Pageable pageable);


    /**
     * Finds notes created by a specific user ordered by last update time.
     *
     * @param creatorId ID of the note creator
     * @return list of notes created by the user
     */
    List<Note> findByCreator_IdOrderByUpdatedAtDesc(Long creatorId);

    /**
     * Finds notes created by a specific user inside selected folders.
     *
     * @param creatorId ID of the note creator
     * @param folderIds IDs of folders
     * @return list of notes created by the user in selected folders
     */
    List<Note> findByCreator_IdAndFolder_IdInOrderByUpdatedAtDesc(Long creatorId, Collection<Long> folderIds);

    /**
     * Deletes all notes that belong to a folder.
     *
     * @param folderId ID of the folder
     */
    void deleteByFolder_Id(Long folderId);

    /**
     * Counts notes inside a folder.
     *
     * @param folderId ID of the folder
     * @return number of notes in the folder
     */
    long countByFolder_Id(Long folderId);

    /**
     * Counts notes created by a specific user.
     *
     * @param userId ID of the user
     * @return number of notes created by the user
     */
    long countByCreator_Id(Long userId);
}
