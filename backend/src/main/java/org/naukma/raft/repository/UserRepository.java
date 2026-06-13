package org.naukma.raft.repository;

import org.naukma.raft.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailOrUsername(String email, String username);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.username)  LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(u.lastName)  LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    List<User> searchByNameOrUsername(@Param("query") String query, Pageable pageable);
}
