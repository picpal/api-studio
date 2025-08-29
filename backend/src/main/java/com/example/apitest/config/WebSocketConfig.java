package com.example.apitest.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpSession;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 메시지를 구독하는 클라이언트에게 메시지를 전달하는 브로커 설정
        config.enableSimpleBroker("/topic", "/queue");
        // 클라이언트가 서버로 메시지를 보낼 때 사용할 prefix
        config.setApplicationDestinationPrefixes("/app");
        // 사용자별 메시지 prefix 설정
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 연결 엔드포인트
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002")
                .addInterceptors(new HttpSessionHandshakeInterceptor())
                .withSockJS(); // SockJS fallback 지원
    }

    // HTTP 세션의 인증 정보를 WebSocket으로 전달하는 Interceptor
    private static class HttpSessionHandshakeInterceptor implements HandshakeInterceptor {
        
        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
            
            if (request instanceof ServletServerHttpRequest) {
                ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
                HttpSession session = servletRequest.getServletRequest().getSession(false);
                
                if (session != null) {
                    // 세션에서 SecurityContext 가져오기
                    Object securityContext = session.getAttribute("SPRING_SECURITY_CONTEXT");
                    if (securityContext != null) {
                        attributes.put("SPRING_SECURITY_CONTEXT", securityContext);
                    }
                }
            }
            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                WebSocketHandler wsHandler, Exception exception) {
        }
    }
}