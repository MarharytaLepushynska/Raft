package org.naukma.raft.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST controller serving basic server health checks and heartbeat indicators.
 */
@RestController
public class StatusController {

    /** Returns a simple uptime status payload to verify the backend container instance is alive. */
    @GetMapping("/api/status")
    public Map<String, String> status() {
        return Map.of("status", "running");
    }
}
