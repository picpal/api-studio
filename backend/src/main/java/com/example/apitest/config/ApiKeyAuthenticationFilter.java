package com.example.apitest.config;

import com.example.apitest.entity.ApiKey;
import com.example.apitest.service.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {
    
    private static final String API_KEY_HEADER = "X-API-Key";
    
    @Autowired
    private ApiKeyService apiKeyService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String apiKey = request.getHeader(API_KEY_HEADER);
        
        // API 키가 있는 경우에만 API 키 인증 시도
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            Optional<ApiKey> validApiKey = apiKeyService.validateApiKey(apiKey);
            
            if (validApiKey.isPresent()) {
                ApiKey key = validApiKey.get();
                
                // API 키 기반 인증 설정
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                        key.getUser().getEmail(),
                        null,
                        Collections.singletonList(
                            new SimpleGrantedAuthority("ROLE_" + key.getUser().getRole().toString())
                        )
                    );
                
                // API 키 정보를 request attribute에 저장 (권한 체크용)
                request.setAttribute("apiKey", key);
                request.setAttribute("authenticatedUser", key.getUser());
                
                // SecurityContext에 인증 정보 설정
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // API 키 인증임을 표시
                request.setAttribute("API_KEY_AUTHENTICATED", true);
                
                filterChain.doFilter(request, response);
                
                // API 키 인증은 stateless이므로 요청 후 SecurityContext 클리어
                SecurityContextHolder.clearContext();
                return;
            } else {
                // 잘못된 API 키
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Invalid API key\"}");
                response.setContentType("application/json");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        
        // 인증이 필요 없는 경로들
        return path.startsWith("/api/auth/") || 
               path.startsWith("/h2-console/") ||
               path.equals("/api/admin/reset-password");
    }
}