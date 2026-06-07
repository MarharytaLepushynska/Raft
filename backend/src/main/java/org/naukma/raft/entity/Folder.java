package org.naukma.raft.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.naukma.raft.enums.WorkspaceType;

import java.time.LocalDateTime;

public class Folder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FolderType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @CreationTimestamp
    @Column(nullable = false)
    private LocalDateTime created;
}
