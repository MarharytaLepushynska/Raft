package org.naukma.raft.repository;

import org.naukma.raft.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;

/**
 * Repository for accessing calendar events.
 *
 * Provides methods for retrieving events from specific workspaces
 * and deleting events when a workspace is removed.
 */
public interface EventRepository extends JpaRepository<Event, Long> {

    /**
     * Finds events from the given workspaces ordered by start time.
     *
     * @param workspaceIds IDs of accessible workspaces
     * @return list of events ordered by start time
     */
    List<Event> findByWorkspace_IdInOrderByStartTimeAsc(Collection<Long> workspaceIds);

    /**
     * Deletes all events that belong to a workspace.
     *
     * @param workspaceId ID of the workspace
     */
    void deleteByWorkspace_Id(Long workspaceId);
}
