package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.CreateExpenseRequest;
import org.naukma.raft.dto.response.*;
import org.naukma.raft.entity.*;
import org.naukma.raft.errorsHadling.AccessDeniedException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.ExpenseMemberRepository;
import org.naukma.raft.repository.ExpenseRepository;
import org.naukma.raft.repository.UserRepository;
import org.naukma.raft.repository.WorkspaceMemberRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final ExpenseMemberRepository expenseMemberRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;

    public ExpenseResponse createExpense(CreateExpenseRequest request, Long currentUserId) {
        memberRepository.findByWorkspace_IdAndUser_Id(request.getWorkspaceId(), currentUserId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this workspace"));

        List<User> participants;
        if (request.getParticipantIds() == null || request.getParticipantIds().isEmpty()) {
            participants = memberRepository
                    .findByWorkspace_Id(request.getWorkspaceId())
                    .stream()
                    .map(WorkspaceMember::getUser)
                    .toList();
        } else {
            participants = userRepository.findAllById(request.getParticipantIds());
        }

        System.out.println("participantIds from request: " + request.getParticipantIds());

        BigDecimal share = request.getAmount()
                .divide(BigDecimal.valueOf(participants.size()), 2, RoundingMode.HALF_UP);

        User paidBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Workspace workspace = memberRepository
                .findByWorkspace_IdAndUser_Id(request.getWorkspaceId(), currentUserId)
                .get().getWorkspace();

        Expense expense = Expense.builder()
                .workspace(workspace)
                .paidBy(paidBy)
                .title(request.getTitle())
                .amount(request.getAmount())
                .build();

        List<ExpenseMember> splits = participants.stream()
                .map(user -> ExpenseMember.builder()
                        .expense(expense)
                        .user(user)
                        .share(share)
                        .isSettled(user.getId().equals(currentUserId))
                        .build())
                .toList();

        expense.setSplits(splits);
        return mapToResponse(expenseRepository.save(expense));
    }

    public WorkspaceExpenseStatsResponse getWorkspaceStats(Long workspaceId, Long currentUserId) {
        memberRepository.findByWorkspace_IdAndUser_Id(workspaceId, currentUserId)
                .orElseThrow(() -> new NotFoundException("You are not a member of this workspace"));

        List<Expense> expenses = expenseRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);

        BigDecimal total = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<WorkspaceMember> members = memberRepository.findByWorkspace_Id(workspaceId);
        List<UserBalanceResponse> balances = members.stream()
                .map(member -> calculateUserBalance(member.getUser(), expenses))
                .toList();

        return WorkspaceExpenseStatsResponse.builder()
                .totalAmount(total)
                .balances(balances)
                .recentExpenses(expenses.stream().limit(10).map(this::mapToResponse).toList())
                .build();
    }

    public PersonalExpenseStatsResponse getPersonalStats(Long currentUserId, LocalDate from, LocalDate to, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : null;

        Page<Expense> historyPage = expenseRepository.findByUserInvolvedPaged(currentUserId, fromDateTime, toDateTime, pageable);

        List<ExpenseMember> myDebts = expenseMemberRepository
                .findByUser_IdAndIsSettledFalse(currentUserId)
                .stream()
                .filter(s -> !s.getExpense().getPaidBy().getId().equals(currentUserId))
                .filter(s -> isInRange(s.getExpense().getCreatedAt(), fromDateTime, toDateTime))
                .toList();

        Map<User, List<ExpenseMember>> debtsByCreditor = myDebts.stream()
                .collect(Collectors.groupingBy(s -> s.getExpense().getPaidBy()));

        List<DebtSummaryResponse> iOwe = debtsByCreditor.entrySet().stream()
                .map(entry -> DebtSummaryResponse.builder()
                        .user(mapUserToSummary(entry.getKey()))
                        .amount(entry.getValue().stream()
                                .map(ExpenseMember::getShare)
                                .reduce(BigDecimal.ZERO, BigDecimal::add))
                        .relatedExpenses(entry.getValue().stream()
                                .map(s -> mapToResponse(s.getExpense()))
                                .toList())
                        .build())
                .toList();

        List<Expense> paidByMe = expenseRepository.findByPaidById(currentUserId)
                .stream()
                .filter(e -> isInRange(e.getCreatedAt(), fromDateTime, toDateTime))
                .toList();

        Map<User, List<ExpenseMember>> debtsToMe = new HashMap<>();
        for (Expense expense : paidByMe) {
            for (ExpenseMember split : expense.getSplits()) {
                if (!split.isSettled() && !split.getUser().getId().equals(currentUserId)) {
                    debtsToMe.computeIfAbsent(split.getUser(), u -> new ArrayList<>()).add(split);
                }
            }
        }

        List<DebtSummaryResponse> owedToMe = debtsToMe.entrySet().stream()
                .map(entry -> DebtSummaryResponse.builder()
                        .user(mapUserToSummary(entry.getKey()))
                        .amount(entry.getValue().stream()
                                .map(ExpenseMember::getShare)
                                .reduce(BigDecimal.ZERO, BigDecimal::add))
                        .relatedExpenses(entry.getValue().stream()
                                .map(s -> mapToResponse(s.getExpense()))
                                .toList())
                        .build())
                .toList();

        BigDecimal totalIOwe = iOwe.stream()
                .map(DebtSummaryResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOwedToMe = owedToMe.stream()
                .map(DebtSummaryResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return PersonalExpenseStatsResponse.builder()
                .totalIOwe(totalIOwe)
                .totalOwedToMe(totalOwedToMe)
                .iOwe(iOwe)
                .owedToMe(owedToMe)
                .history(historyPage.getContent()
                        .stream()
                        .map(this::mapToResponse)
                        .toList())
                .historyPage(historyPage.getNumber())
                .historyTotalPages(historyPage.getTotalPages())
                .historyTotal(historyPage.getTotalElements())
                .build();
    }

    public void settleSplit(Long splitId, Long currentUserId) {
        ExpenseMember split = expenseMemberRepository.findById(splitId)
                .orElseThrow(() -> new NotFoundException("Split not found"));

        if (!split.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You cam settle your own splits");
        }

        split.setSettled(true);
        expenseMemberRepository.save(split);
    }

    private boolean isInRange(LocalDateTime date, LocalDateTime from, LocalDateTime to) {
        if (from != null && date.isBefore(from)) return false;
        if (to != null && date.isAfter(to)) return false;
        return true;
    }

    private UserBalanceResponse calculateUserBalance(User user, List<Expense> expenses) {
        BigDecimal totalPaid = expenses.stream()
                .filter(e -> e.getPaidBy().getId().equals(user.getId()))
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOwes = expenses.stream()
                .flatMap(e -> e.getSplits().stream())
                .filter(s -> s.getUser().getId().equals(user.getId()) && !s.isSettled())
                .map(ExpenseMember::getShare)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return UserBalanceResponse.builder()
                .user(mapUserToSummary(user))
                .totalPaid(totalPaid)
                .totalOwes(totalOwes)
                .balance(totalPaid.subtract(totalOwes))
                .build();
    }

    private ExpenseResponse mapToResponse(Expense expense) {

        return ExpenseResponse.builder()
                .id(expense.getId())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .paidBy(mapUserToSummary(expense.getPaidBy()))
                .splits(expense.getSplits().stream()
                        .map(s -> ExpenseSplitResponse.builder()
                                .id(s.getId().toString())
                                .user(mapUserToSummary(s.getUser()))
                                .share(s.getShare())
                                .isSettled(s.isSettled())
                                .build())
                        .toList())
                .createdAt(expense.getCreatedAt())
                .build();
    }

    private UserSummaryResponse mapUserToSummary(User user) {
        return UserSummaryResponse.builder()
                .id(String.valueOf(user.getId()))
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatar(user.getAvatar())
                .build();
    }

    public List<ExpenseResponse> getWorkspaceExpenses(Long workspaceId, Long userId) {
        memberRepository.findByWorkspace_IdAndUser_Id(workspaceId, userId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this workspace"));

        return expenseRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }
}
