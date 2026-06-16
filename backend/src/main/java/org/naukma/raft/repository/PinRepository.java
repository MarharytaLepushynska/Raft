package org.naukma.raft.repository;

import org.naukma.raft.entity.Pin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Repository for accessing user pins.
 *
 * Provides methods for retrieving pins created by a user
 * and counting how many pins the user has.
 */
public interface PinRepository extends JpaRepository<Pin, Long> {
    /**
     * Finds all pins created by a specific user.
     *
     * @param userId ID of the user
     * @return list of user pins
     */
    List<Pin> findByUserId(Long userId);

    /**
     * Counts pins created by a specific user.
     *
     * @param userId ID of the user
     * @return number of user pins
     */
    long countByUserId(Long userId);
}