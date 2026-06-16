package org.naukma.raft.controller;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.response.ExpenseResponse;
import org.naukma.raft.dto.response.WorkspaceExpenseStatsResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.ExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for tracking ledger operations and transaction sheets scoped to a single workspace.
 */
@RestController
@RequestMapping("/api/workspaces/{workspaceId}/expenses")
@RequiredArgsConstructor
public class WorkspaceExpenseController {
    private final ExpenseService expenseService;

    /** Compiles collective pool status balances and historical debt matrices inside a workspace node. */
    @GetMapping("/stats")
    public ResponseEntity<WorkspaceExpenseStatsResponse> getWorkspaceStats(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = ((CustomUserDetails) userDetails).getId();
        return ResponseEntity.ok(expenseService.getWorkspaceStats(workspaceId, userId));
    }

    /** Pulls transaction items and invoices attached strictly within a specific workspace boundary. */
    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> getExpenses(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = ((CustomUserDetails) userDetails).getId();
        return ResponseEntity.ok(expenseService.getWorkspaceExpenses(workspaceId, userId));
    }
}
