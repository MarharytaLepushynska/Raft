package org.naukma.raft.security;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.entity.User;
import org.naukma.raft.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Service used by Spring Security to load users during authentication.
 *
 * Users can be found by either email or username and are converted
 * into CustomUserDetails for further security processing.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    /**
     * Loads a user by email or username.
     *
     * Spring Security calls this method during authentication.
     * If the user exists, it is wrapped into CustomUserDetails.
     *
     * @param identifier email or username entered by the user
     * @return user details used by Spring Security
     * @throws UsernameNotFoundException if no user with this identifier exists
     */
    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException{
        User user = userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase(identifier, identifier)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + identifier));

        return new CustomUserDetails(user);
    }
}
