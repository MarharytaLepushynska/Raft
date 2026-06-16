package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.LoginRequest;
import org.naukma.raft.dto.request.UserRequest;
import org.naukma.raft.dto.response.AuthResponse;
import org.naukma.raft.dto.response.UserResponse;
import org.naukma.raft.entity.User;
import org.naukma.raft.enums.NotificationType;
import org.naukma.raft.errorsHadling.EmailAreadyExsistsException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.UserRepository;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.security.JwtService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsible for user authentication and registration.
 *
 * Handles account creation, login, password encoding, JWT generation,
 * personal workspace initialization and welcome notification creation.
 */
@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final WorkspaceService workspaceService;
    private final NotificationService notificationService;

    /**
     * Registers a new user in the system.
     *
     * The method normalizes email and username, checks their uniqueness,
     * saves the user, creates a personal workspace, creates a welcome notification
     * and returns an authentication token.
     *
     * @param userRequest registration data
     * @return authentication response with JWT token and user data
     */
    @Transactional
    public AuthResponse register(UserRequest userRequest) {
        String email = userRequest.getEmail().trim().toLowerCase();
        String username = userRequest.getUsername().trim().toLowerCase();

        if(userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAreadyExsistsException("Email already in use");
        }

        if(userRepository.existsByUsernameIgnoreCase(username)) {
            throw new EmailAreadyExsistsException("Username already taken");
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        user.setFirstName(userRequest.getFirstName().trim());
        user.setLastName(userRequest.getLastName().trim());
        user.setAvatar(userRequest.getAvatar());

        User saved;
        try {
            saved = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw new EmailAreadyExsistsException("Email or username already in use");
        }

        workspaceService.ensurePersonalWorkspace(saved.getId());
        createWelcomeNotification(saved);
        CustomUserDetails userDetails = new CustomUserDetails(saved);
        String token = jwtService.generateToken(userDetails);

        return new AuthResponse(token, mapToResponse(saved));
    }

    /**
     * Authenticates a user by email or username and returns a JWT token.
     *
     * @param loginRequest login credentials
     * @return authentication response with JWT token and user data
     */
    public AuthResponse login(LoginRequest loginRequest) {
        String login = loginRequest.getLogin().trim();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(login, loginRequest.getPassword()));

        User user = userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase(login, login)
                .orElseThrow(() -> new NotFoundException("User not found"));

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtService.generateToken(userDetails);

        return new AuthResponse(token, mapToResponse(user));
    }


    /**
     * Creates a system welcome notification for a newly registered user.
     *
     * @param user newly registered user
     */
    private void createWelcomeNotification(User user) {
        notificationService.createNotification(
                user.getId(),
                NotificationType.SYSTEM,
                "Welcome to Raft",
                "Your account was created successfully. You can now organize your tasks, workspaces and reminders in Raft.",
                user.getId()
        );
    }

    /**
     * Converts a user entity into a response DTO.
     *
     * @param user user entity
     * @return user response DTO
     */
    private UserResponse mapToResponse(User user) {
        UserResponse userResponse = new UserResponse();
        userResponse.setId(user.getId().toString());
        userResponse.setUsername(user.getUsername());
        userResponse.setEmail(user.getEmail());
        userResponse.setFirstName(user.getFirstName());
        userResponse.setLastName(user.getLastName());
        userResponse.setAvatar(user.getAvatar());
        return userResponse;
    }
}
