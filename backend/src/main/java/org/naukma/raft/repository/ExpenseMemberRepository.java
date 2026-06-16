package org.naukma.raft.repository;

import org.naukma.raft.entity.ExpenseMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for accessing expense split records.
 *
 * Provides methods for retrieving user shares, unsettled debts
 * and workspace-specific split information.
 */
@Repository
public interface ExpenseMemberRepository extends JpaRepository<ExpenseMember, Long> {
    /**
     * Finds all split records for a specific expense.
     *
     * @param expenseId ID of the expense
     * @return list of expense member records
     */
    List<ExpenseMember> findByExpenseId(Long expenseId);

    /**
     * Finds all unsettled expense shares assigned to a user.
     *
     * @param userId ID of the user
     * @return list of unsettled expense shares
     */
    List<ExpenseMember> findByUser_IdAndIsSettledFalse(Long userId);

    @Query("""
          SELECT s FROM ExpenseMember s
          JOIN s.expense e
          WHERE s.user.id = :userId
          AND e.workspace.id = :workspaceId
          """)

    /**
     * Finds expense shares assigned to a user inside a specific workspace.
     *
     * @param userId ID of the user
     * @param workspaceId ID of the workspace
     * @return list of user's expense shares in the workspace
     */
    List<ExpenseMember> findByUserIdAndWorkspaceId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    /**
     * Counts all expense shares assigned to a user.
     *
     * @param userId ID of the user
     * @return total number of expense shares
     */
    long countByUser_Id(Long userId);
    /**
     * Counts unsettled expense shares assigned to a user.
     *
     * @param userId ID of the user
     * @return number of unsettled expense shares
     */
    long countByUser_IdAndIsSettledFalse(Long userId);

    /**
     * Finds all expense shares assigned to a user.
     *
     * @param userId ID of the user
     * @return list of expense shares
     */
    List<ExpenseMember> findByUser_Id(Long userId);
}
