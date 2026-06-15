package org.naukma.raft.repository;

import org.naukma.raft.entity.ExpenseMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseMemberRepository extends JpaRepository<ExpenseMember, Long> {
    List<ExpenseMember> findByExpenseId(Long expenseId);

    List<ExpenseMember> findByUser_IdAndIsSettledFalse(Long userId);

    @Query("""
          SELECT s FROM ExpenseMember s
          JOIN s.expense e
          WHERE s.user.id = :userId
          AND e.workspace.id = :workspaceId
          """)
    List<ExpenseMember> findByUserIdAndWorkspaceId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    long countByUser_Id(Long userId);
    long countByUser_IdAndIsSettledFalse(Long userId);

    List<ExpenseMember> findByUser_Id(Long userId);
}
