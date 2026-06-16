package org.naukma.raft.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.naukma.raft.entity.Achievement;
import org.naukma.raft.repository.AchievementRepository;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with default achievements on application startup.
 * Checks for missing records by code to prevent duplicates.
 */
@Component
@RequiredArgsConstructor
public class AchievementSeeder {
    private final AchievementRepository achievementRepository;

    /** Populates predefined system achievements if they do not exist yet. */
    @PostConstruct
    public void seed() {
        seedIfMissing("TASKS_10", "10 завдань виконано", "Виконайте 10 завдань", "tasks-10.png");
        seedIfMissing("TASKS_50", "50 завдань виконано", "Виконайте 50 завдань", "tasks-50.png");
        /*seedIfMissing("PLANNING_7_DAYS", "Тижневий планувальник", "Плануйте 7 днів підряд", "streak-7.svg");
        seedIfMissing("PLANNING_30_DAYS", "Місячний планувальник", "Плануйте 30 днів підряд", "streak-30.svg");*/
        seedIfMissing("EXPENSES_15", "15 витрат", "Створіть 15 спільних витрат", "expenses-15.png");
        seedIfMissing("WORKSPACE_CREATED", "Перший простір", "Створіть свій перший спільний простір", "workspace-1.png");
        seedIfMissing("NOTES_5", "Нотатник", "Створіть 5 нотаток", "notes-5.png");
        //seedIfMissing("EARLY_BIRD", "Рання пташка", "Виконайте задачу до 9:00", "early-bird.svg");
        seedIfMissing("ALL_SETTLED", "Чиста совість", "Розрахуйтесь по всіх боргах", "settled.png");
        seedIfMissing("FIRST_WEEK", "Перший тиждень", "Користуйтесь Raft 7 днів", "week-1.png");
    }

    /** Saves an achievement only if its unique code is not present in the database. */
    private void seedIfMissing(String code, String title, String description, String icon) {
        if (achievementRepository.findByCode(code).isEmpty()) {
            achievementRepository.save(Achievement.builder()
                    .code(code)
                    .title(title)
                    .description(description)
                    .icon(icon)
            .build());
        }
    }
}
