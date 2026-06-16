package org.naukma.raft.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Converts a User entity into a short user summary DTO.
 *
 * This summary is used inside chat responses to show basic sender information
 * without exposing the full user entity.
 *
 * @param user user entity to convert
 * @return short user summary response
 */
@Entity
@Table(name = "achievements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    @Column
    private String icon;
}
