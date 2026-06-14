package org.naukma.raft.repository;

import org.naukma.raft.entity.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);

    List<Expense> findByWorkspaceIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long workspaceId, LocalDateTime from, LocalDateTime to);

    @Query("""
        SELECT DISTINCT e FROM Expense e
        LEFT JOIN e.splits s
        WHERE e.workspace.id = :workspaceId
        AND (e.paidBy.id = :userId OR s.user.id = :userId)
        ORDER BY e.createdAt DESC
        """)
    List<Expense> findByWorkspaceAndUser(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

    @Query("""
    SELECT DISTINCT e FROM Expense e
    LEFT JOIN e.splits s
    WHERE (e.paidBy.id = :userId OR s.user.id = :userId)
    AND (:from IS NULL OR e.createdAt >= :from)
    AND (:to IS NULL OR e.createdAt <= :to)
    """)
    Page<Expense> findByUserInvolvedPaged(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    List<Expense> findByPaidById(Long userId);
}
