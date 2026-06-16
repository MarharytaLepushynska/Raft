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

/**
 * Repository for accessing shared expenses.
 *
 * Provides methods for retrieving workspace expenses, filtering expenses
 * by date range, finding expenses related to a user and counting expenses
 * created by a payer.
 */
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    /**
     * Finds all expenses in a workspace ordered from newest to oldest.
     *
     * @param workspaceId ID of the workspace
     * @return list of workspace expenses
     */
    List<Expense> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);

    /**
     * Finds workspace expenses created within the selected date range.
     *
     * @param workspaceId ID of the workspace
     * @param from start date-time
     * @param to end date-time
     * @return list of expenses ordered from newest to oldest
     */
    List<Expense> findByWorkspaceIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long workspaceId, LocalDateTime from, LocalDateTime to);

    @Query("""
        SELECT DISTINCT e FROM Expense e
        LEFT JOIN e.splits s
        WHERE e.workspace.id = :workspaceId
        AND (e.paidBy.id = :userId OR s.user.id = :userId)
        ORDER BY e.createdAt DESC
        """)
    /**
     * Finds expenses in a workspace where the user is either the payer
     * or one of the split participants.
     *
     * @param workspaceId ID of the workspace
     * @param userId ID of the user
     * @return list of expenses related to the user
     */
    List<Expense> findByWorkspaceAndUser(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

    @Query("""
    SELECT DISTINCT e FROM Expense e
    LEFT JOIN e.splits s
    WHERE (e.paidBy.id = :userId OR s.user.id = :userId)
    AND (:from IS NULL OR e.createdAt >= :from)
    AND (:to IS NULL OR e.createdAt <= :to)
    """)
    /**
     * Finds paged expenses where the user is involved as payer or participant.
     *
     * Optional date filters can be used to limit the result.
     *
     * @param userId ID of the user
     * @param from optional start date-time
     * @param to optional end date-time
     * @param pageable pagination settings
     * @return page of user-related expenses
     */
    Page<Expense> findByUserInvolvedPaged(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    /**
     * Finds all expenses paid by a specific user.
     *
     * @param userId ID of the payer
     * @return list of expenses paid by the user
     */
    List<Expense> findByPaidById(Long userId);

    /**
     * Counts how many expenses were paid by a specific user.
     *
     * @param userId ID of the payer
     * @return number of expenses paid by the user
     */
    long countByPaidById(Long userId);
}
