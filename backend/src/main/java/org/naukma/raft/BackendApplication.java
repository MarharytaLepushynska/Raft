package org.naukma.raft;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point of the Raft backend application.
 *
 * Starts the Spring Boot application context and enables scheduled tasks,
 * such as reminder processing and automatic achievement checks.
 */
@SpringBootApplication
@EnableScheduling
public class BackendApplication {
    /**
     * Starts the backend application.
     *
     * @param args command-line arguments passed to the application
     */
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}
