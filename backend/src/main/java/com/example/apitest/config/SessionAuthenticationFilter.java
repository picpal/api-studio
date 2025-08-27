package com.example.apitest.config;

import com.example.apitest.entity.User;
import com.example.apitest.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

public class SessionAuthenticationFilter extends OncePerRequestFilter {
    
    private final AuthService authService;
    
    public SessionAuthenticationFilter(AuthService authService) {
        this.authService = authService;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        HttpSession session = request.getSession(false);
        
        if (session != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            Long userId = (Long) session.getAttribute("userId");
            String userEmail = (String) session.getAttribute("userEmail");
            
            if (userId != null && userEmail != null) {
                Optional<User> userOpt = authService.findByEmail(userEmail);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    
                    // Set user in request attribute for AspectJ
                    request.setAttribute("sessionUser", user);
                    
                    // Create authentication token
                    UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                        );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        }
        
        filterChain.doFilter(request, response);
    }
}