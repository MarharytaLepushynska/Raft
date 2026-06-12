package org.naukma.raft.repository;

import org.naukma.raft.entity.Pin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PinRepository extends JpaRepository<Pin, Long> {
    List<Pin> findByUserId(Long userId);

    long countByUserId(Long userId);
}