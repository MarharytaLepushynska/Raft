package org.naukma.raft.repository;

import org.naukma.raft.entity.Workspace;
import org.naukma.raft.enums.WorkspaceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    Optional<Workspace> findFirstByOwner_IdAndType(Long ownerId, WorkspaceType type);
}
