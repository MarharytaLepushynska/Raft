 package org.naukma.raft.repository;

import org.naukma.raft.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

 /**
  * Repository for accessing reminders.
  *
  * Provides methods for retrieving user reminders, finding due reminders
  * for scheduled processing and counting upcoming reminders.
  */
public interface ReminderRepository extends JpaRepository<Reminder, Long> {
     /**
      * Finds reminders created by a user ordered by reminder time.
      *
      * @param userId ID of the user
      * @return list of user reminders
      */
    List<Reminder> findByUser_IdOrderByReminderTimeAsc(Long userId);

     /**
      * Finds a reminder by ID only if it belongs to the selected user.
      *
      * @param id reminder ID
      * @param userId ID of the reminder owner
      * @return reminder, if it belongs to the user
      */
    Optional<Reminder> findByIdAndUser_Id(Long id, Long userId);

    @Query("""
        select r from Reminder r
        where r.isSent = false
        and r.reminderTime <= :now
        order by r.reminderTime asc
        """)

    /**
     * Finds reminders whose reminder time has already come and were not sent yet.
     *
     * This method is used by the scheduler to process due reminders.
     *
     * @param now current date-time
     * @return list of due reminders ordered by reminder time
     */
    List<Reminder> findDueReminders(@Param("now") LocalDateTime now);

    @Query("""
        select count(r)
        from Reminder r
        where r.user.id = :userId
        and r.isSent = false
        and r.reminderTime > :now
        """)

    /**
     * Counts upcoming unsent reminders for a user.
     *
     * @param userId ID of the user
     * @param now current date-time
     * @return number of future reminders that have not been sent yet
     */
    long countUpcomingUserReminders(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );
}
