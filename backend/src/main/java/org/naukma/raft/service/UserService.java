package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.ProfileUpdateRequest;
import org.naukma.raft.dto.response.UserResponse;
import org.naukma.raft.dto.response.UserSummaryResponse;
import org.naukma.raft.entity.User;
import org.naukma.raft.errorsHadling.EmailAreadyExsistsException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service responsible for user profile operations.
 *
 * Handles reading, updating, searching and deleting users.
 */
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    /**
     * Returns user profile data by ID.
     *
     * @param id user ID
     * @return user response DTO
     */
    public UserResponse getUserById(Long id){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return mapToResponse(user);
    }

    /**
     * Updates user profile data.
     *
     * Email and username are checked for uniqueness before saving.
     *
     * @param id ID of the user to update
     * @param request profile update data
     * @return updated user response
     */
    @Transactional
    public UserResponse updateUser(Long id, ProfileUpdateRequest request){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        String email = request.getEmail().trim().toLowerCase();
        String username = request.getUsername().trim().toLowerCase();

        if(!user.getEmail().equalsIgnoreCase(email) && userRepository.existsByEmailIgnoreCase(email)){
            throw new EmailAreadyExsistsException("Email already in use");
        }
        if(!username.equalsIgnoreCase(user.getUsername()) && userRepository.existsByUsernameIgnoreCase(username)){
            throw new EmailAreadyExsistsException("Username already taken");
        }

        user.setEmail(email);
        user.setUsername(username);
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setAvatar(request.getAvatar());

        try {
            return mapToResponse(userRepository.saveAndFlush(user));
        } catch (DataIntegrityViolationException e) {
            throw new EmailAreadyExsistsException("Email or username already in use");
        }
    }

    /**
     * Searches users by name or username and excludes the current user from results.
     *
     * @param query search query
     * @param excludeUserId ID of the user that should not appear in results
     * @return list of user summaries
     */
    public List<UserSummaryResponse> searchUsers(String query, Long excludeUserId){
        String q = query == null ? "" : query.trim();
        if(q.isEmpty()) { return List.of(); }
        return userRepository.searchByNameOrUsername(q, PageRequest.of(0, 8))
                .stream()
                .filter(user -> !user.getId().equals(excludeUserId))
                .map(this::toSummary)
                .toList();
    }

    /**
     * Deletes a user by ID.
     *
     * @param id ID of the user to delete
     */
    public void deleteUser(Long id){
        userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        userRepository.deleteById(id);
    }

    /**
     * Converts a User entity into a full UserResponse DTO.
     *
     * This response is used for profile-related operations
     * where the user's full public profile data is needed.
     *
     * @param user user entity to convert
     * @return full user response DTO
     */
    private UserResponse mapToResponse(User user){
        UserResponse response = new UserResponse();
        response.setId(user.getId().toString());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setAvatar(user.getAvatar());
        return response;
    }

    /**
     * Converts a User entity into a short user summary DTO.
     *
     * This response is used when user data is embedded into other responses,
     * such as tasks, notes, members or expenses.
     *
     * @param user user entity to convert
     * @return short user summary response
     */
    private UserSummaryResponse toSummary(User user){
        return UserSummaryResponse.builder()
                .id(user.getId().toString())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatar(user.getAvatar())
                .build();
    }
}
