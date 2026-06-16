package org.naukma.raft.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a user participating in an event.
 *
 * This entity connects events with users and can be used to track
 * which workspace members are involved in a specific calendar event.
 */
@Entity
@Table(name = "event_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventParticipants {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
