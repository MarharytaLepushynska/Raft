package org.naukma.raft.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.naukma.raft.enums.PinType;

@Entity
@Table(name = "pins")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id")
    private Note note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PinType type;

    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    private String title;
    private String text;

    @Column(nullable = false)
    private Double x;

    @Column(nullable = false)
    private Double y;

    @Column(nullable = false)
    private Double rotate;
}
