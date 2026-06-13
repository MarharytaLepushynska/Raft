package org.naukma.raft.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.CreateExpenseRequest;
import org.naukma.raft.dto.response.ExpenseResponse;
import org.naukma.raft.dto.response.PersonalExpenseStatsResponse;
import org.naukma.raft.dto.response.WorkspaceExpenseStatsResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.ExpenseService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.awt.print.Pageable;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {
    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(
            @Valid @RequestBody CreateExpenseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = ((CustomUserDetails) userDetails).getId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(expenseService.createExpense(request, userId));
    }

    @GetMapping("/my")
    public ResponseEntity<PersonalExpenseStatsResponse> getPersonalStats(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @AuthenticationPrincipal UserDetails userDetails,
            int page, int size) {


        Long userId = ((CustomUserDetails) userDetails).getId();
        return ResponseEntity.ok(expenseService.getPersonalStats(userId, from, to));
    }

    @PatchMapping("/splits/{splitId}/settle")
    public ResponseEntity<Void> settleSplit(
            @PathVariable Long splitId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((CustomUserDetails) userDetails).getId();
        expenseService.settleSplit(splitId, userId);
        return ResponseEntity.noContent().build();
    }
}
