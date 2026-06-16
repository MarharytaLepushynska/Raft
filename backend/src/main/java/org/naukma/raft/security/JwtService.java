package org.naukma.raft.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

/**
 * Service responsible for creating and validating JWT tokens.
 *
 * It generates tokens for authenticated users, extracts token claims
 * and verifies token expiration and ownership.
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private Long expiration;

    /**
     * Generates a JWT token for the authenticated user.
     *
     * The token contains the user's email as the subject and the user ID
     * as an additional claim.
     *
     * @param userDetails authenticated user details
     * @return signed JWT token
     */
    public String generateToken(CustomUserDetails userDetails) {
        return Jwts.builder()
                .subject(userDetails.getEmail())
                .claim("userId", userDetails.getId())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extracts the user's email from a JWT token.
     *
     * The email is stored as the token subject.
     *
     * @param token JWT token
     * @return email stored in the token
     */
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts the user ID from a JWT token.
     *
     * @param token JWT token
     * @return user ID stored in the token claims
     */
    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    /**
     * Checks whether the token belongs to the given user and is not expired.
     *
     * @param token JWT token
     * @param userDetails user details loaded by Spring Security
     * @return true if the token is valid for the user
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        String email = extractEmail(token);
        return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }


    /**
     * Checks whether the JWT token is expired.
     *
     * @param token JWT token
     * @return true if the token expiration date is before the current time
     */
    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    /**
     * Extracts a selected claim from the JWT token.
     *
     * The method parses the signed token, verifies it with the signing key
     * and applies the provided resolver function to the token claims.
     *
     * @param token JWT token
     * @param claimsResolver function that extracts a specific claim
     * @return extracted claim value
     * @param <T> type of the extracted claim
     */
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claimsResolver.apply(claims);
    }

    /**
     * Builds the secret signing key used for JWT signing and validation.
     *
     * The key is decoded from the Base64 value stored in application properties.
     *
     * @return JWT signing key
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
