package org.naukma.raft.repository;

import org.naukma.raft.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByFolder_IdOrderByUpdatedAtDesc(Long folderId);

    List<Note> findByFolder_IdInOrderByUpdatedAtDesc(Collection<Long> folderIds);

    @Query("""
        SELECT n FROM Note n
        WHERE LOWER(n.title) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(n.content) LIKE LOWER(CONCAT('%', :query, '%'))
        """)
    List<Note> searchByTitleOrContent(@Param("query") String query, Pageable pageable);

    List<Note> findByCreator_IdOrderByUpdatedAtDesc(Long creatorId);

    List<Note> findByCreator_IdAndFolder_IdInOrderByUpdatedAtDesc(Long creatorId, Collection<Long> folderIds);

    void deleteByFolder_Id(Long folderId);

    long countByFolder_Id(Long folderId);

    long countByCreatedById(Long userId);
}
