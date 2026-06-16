package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled component responsible for processing due reminders.
 *
 * Runs periodically and delegates reminder processing to ReminderService.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final ReminderService reminderService;

    /**
     * Processes reminders whose time has already come.
     *
     * If any reminders were processed, the method logs the number of processed items.
     */
    @Scheduled(fixedRate = 60000)
    public void processDueReminders() {
        int processedCount = reminderService.processDueReminders();

        if (processedCount > 0) {
            log.info("Processed {} due reminders", processedCount);
        }
    }
}