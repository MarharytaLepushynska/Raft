package org.naukma.raft.repository;

import org.naukma.raft.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Builds the secret signing key used for JWT signing and validation.
 *
 * The key is decoded from the Base64 value stored in application properties.
 *
 * @return JWT signing key
 */
public interface AchievementRepository extends JpaRepository<Achievement, Long> {

    /**
     * Finds an achievement by its unique code.
     *
     * @param code unique achievement code
     * @return achievement with the given code, if it exists
     */
    Optional<Achievement> findByCode(String code);
}
