package org.naukma.raft.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Represents a user's share in a shared expense.
 *
 * Stores how much the user owes for a specific expense and whether
 * this share has already been settled.
 */
@Entity
@Table(name = "expense_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal share;

    @Column(name = "is_settled", nullable = false)
    private boolean isSettled = false;
}
