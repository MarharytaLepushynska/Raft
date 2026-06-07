package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.UserRequest;
import org.naukma.raft.dto.response.UserResponse;
import org.naukma.raft.entity.User;
import org.naukma.raft.errorsHadling.EmailAreadyExsistsException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getUserById(Long id){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return mapToResponse(user);
    }

    public UserResponse updateUser(Long id, UserRequest userRequest){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if(!user.getEmail().equals(userRequest.getEmail()) &&
        userRepository.existsByEmail(userRequest.getEmail())){
            throw new EmailAreadyExsistsException("Email already in use");
        }

        user.setEmail(userRequest.getEmail());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        user.setFirstName(userRequest.getFirstName().trim());
        user.setLastName(userRequest.getLastName().trim());
        user.setAvatar(userRequest.getAvatar());

        return mapToResponse(userRepository.save(user));
    }

    public void deleteUser(Long id){
        userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        userRepository.deleteById(id);
    }

    private UserResponse mapToResponse(User user){
        UserResponse response = new UserResponse();
        response.setId(user.getId().toString());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setAvatar(user.getAvatar());
        return response;
    }
}
