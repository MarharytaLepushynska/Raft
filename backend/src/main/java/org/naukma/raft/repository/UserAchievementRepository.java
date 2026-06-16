package org.naukma.raft.repository;

import org.naukma.raft.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for accessing achievements earned by users.
 *
 * Provides methods for checking whether a user has already earned
 * a specific achievement and for retrieving earned achievements.
 */
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {

    /**
     * Finds all achievements earned by a user, ordered from newest to oldest.
     *
     * @param userId ID of the user
     * @return list of user achievement records
     */
    List<UserAchievement> findByUser_IdOrderByEarnedAtDesc(Long userId);

    /**
     * Checks whether a user has already earned an achievement with the given code.
     *
     * @param userId ID of the user
     * @param code achievement code
     * @return true if the achievement was already earned
     */
    boolean existsByUser_IdAndAchievement_Code(Long userId, String code);

    /**
     * Finds a specific earned achievement by user ID and achievement code.
     *
     * @param userId ID of the user
     * @param code achievement code
     * @return user achievement record, if it exists
     */
    Optional<UserAchievement> findByUser_IdAndAchievement_Code(Long userId, String code);

    /**
     * Counts achievements earned by a specific user.
     *
     * This method is used for statistics or profile progress calculations.
     *
     * @param userId ID of the user
     * @return number of achievements earned by the user
     */
    long countByUser_Id(Long userId);

    /**
     * Finds all achievements earned by a specific user.
     *
     * @param userId ID of the user
     * @return list of user achievement records
     */
    List<UserAchievement> findByUser_Id(Long userId);
}
