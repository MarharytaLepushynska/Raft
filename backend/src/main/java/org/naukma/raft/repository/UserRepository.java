package org.naukma.raft.repository;

import org.naukma.raft.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository for accessing users.
 *
 * Provides methods for authentication lookup, uniqueness checks
 * and user search by name or username.
 */
public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * Finds a user by email or username, ignoring letter case.
     *
     * @param email email to search by
     * @param username username to search by
     * @return user with matching email or username, if found
     */
    Optional<User> findByEmailIgnoreCaseOrUsernameIgnoreCase(String email, String username);

    /**
     * Finds a user by username, ignoring letter case.
     *
     * @param username username to search by
     * @return user with the selected username, if found
     */
    Optional<User> findByUsernameIgnoreCase(String username);

    /**
     * Checks whether a user with the selected email already exists.
     *
     * @param email email to check
     * @return true if the email is already used
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * Checks whether a user with the selected username already exists.
     *
     * @param username username to check
     * @return true if the username is already used
     */
    boolean existsByUsernameIgnoreCase(String username);

    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.username)  LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(u.lastName)  LIKE LOWER(CONCAT('%', :query, '%'))
            """)

    /**
     * Searches users by username, first name or last name.
     *
     * The search is case-insensitive and limited by the provided pageable object.
     *
     * @param query search query
     * @param pageable pagination and limit settings
     * @return list of matching users
     */
    List<User> searchByNameOrUsername(@Param("query") String query, Pageable pageable);
}
