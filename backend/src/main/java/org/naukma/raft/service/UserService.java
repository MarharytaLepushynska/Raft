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

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public UserResponse getUserById(Long id){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return mapToResponse(user);
    }

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

    public List<UserSummaryResponse> searchUsers(String query, Long excludeUserId){
        String q = query == null ? "" : query.trim();
        if(q.isEmpty()) { return List.of(); }
        return userRepository.searchByNameOrUsername(q, PageRequest.of(0, 8))
                .stream()
                .filter(user -> !user.getId().equals(excludeUserId))
                .map(this::toSummary)
                .toList();
    }

    public void deleteUser(Long id){
        userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        userRepository.deleteById(id);
    }

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
