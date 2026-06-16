package org.naukma.raft.repository;

import org.naukma.raft.entity.EventParticipants;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for accessing event participant records.
 *
 * Uses standard JpaRepository operations for creating, reading,
 * updating and deleting event participants.
 */
public interface EventParticipantsRepository extends JpaRepository<EventParticipants, Long> {
}
