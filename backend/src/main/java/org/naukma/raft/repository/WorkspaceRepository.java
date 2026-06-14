package org.naukma.raft.repository;

import org.naukma.raft.entity.Workspace;
import org.naukma.raft.enums.WorkspaceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    Optional<Workspace> findFirstByOwner_IdAndType(Long ownerId, WorkspaceType type);

    List<Workspace> findByOwner_Id(Long ownerId);

    boolean existsByOwnerIdAndType(Long ownerId, WorkspaceType type);
}
