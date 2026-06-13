package org.naukma.raft.repository;

import org.naukma.raft.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {

    List<UserAchievement> findByUser_IdOrderByEarnedAtDesc(Long userId);

    boolean existsByUser_IdAndAchievement_Code(Long userId, String code);

    Optional<UserAchievement> findByUser_IdAndAchievement_Code(Long userId, String code);

    long countByUser_Id(Long userId);
}
