package org.naukma.raft.security;

import lombok.Getter;
import org.naukma.raft.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Custom Spring Security user details implementation.
 *
 * Wraps the application User entity and exposes only the data required
 * by Spring Security: user ID, email and password.
 */
@Getter
public class CustomUserDetails implements UserDetails {
    private final Long id;
    private final String email;
    private final String password;

    /**
     * Creates security user details from the application User entity.
     *
     * @param user application user entity
     */
    public CustomUserDetails(User user){
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
    }

    /**
     * Creates security user details from the application User entity.
     *
     * @param user application user entity
     */
    @Override
    public String getUsername() {
        return email;
    }

    /**
     * Returns user authorities.
     *
     * The current application does not use role-based Spring Security authorities,
     * so an empty list is returned.
     *
     * @return empty authority collection
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    /**
     * Indicates whether the account is not expired.
     *
     * Account expiration is not used in the current application.
     *
     * @return true because accounts do not expire
     */
    @Override public boolean isAccountNonExpired() { return true; }

    /**
     * Indicates whether the account is not locked.
     *
     * Account locking is not used in the current application.
     *
     * @return true because accounts are not locked
     */
    @Override public boolean isAccountNonLocked() { return true; }

    /**
     * Indicates whether the user's credentials are not expired.
     *
     * Credential expiration is not used in the current application.
     *
     * @return true because credentials do not expire
     */
    @Override public boolean isCredentialsNonExpired() { return true; }

    /**
     * Indicates whether the account is enabled.
     *
     * Account disabling is not used in the current application.
     *
     * @return true because all registered accounts are enabled
     */
    @Override public boolean isEnabled() { return true; }
}
