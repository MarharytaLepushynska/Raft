 package org.naukma.raft.repository;

import org.naukma.raft.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findByUser_IdOrderByReminderTimeAsc(Long userId);

    Optional<Reminder> findByIdAndUser_Id(Long id, Long userId);

    @Query("""
        select r from Reminder r
        where r.isSent = false
        and r.reminderTime <= :now
        order by r.reminderTime asc
        """)
    List<Reminder> findDueReminders(@Param("now") LocalDateTime now);

    @Query("""
        select count(r)
        from Reminder r
        where r.user.id = :userId
        and r.isSent = false
        and r.reminderTime > :now
        """)
    long countUpcomingUserReminders(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );
}
