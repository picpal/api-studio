package com.example.apitest.config;

import com.example.apitest.entity.User;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.MethodParameter;
import org.springframework.messaging.Message;
import org.springframework.messaging.handler.invocation.HandlerMethodArgumentResolver;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.messaging.simp.annotation.support.SimpAnnotationMethodMessageHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.GenericMessage;
import org.springframework.web.socket.messaging.SessionConnectedEvent;

import java.security.Principal;
import java.util.List;

@Configuration
public class WebSocketAuthenticationConfig {
    
    @Autowired
    public void configureArgumentResolvers(SimpAnnotationMethodMessageHandler messageHandler) {
        List<HandlerMethodArgumentResolver> resolvers = messageHandler.getCustomArgumentResolvers();
        resolvers.add(0, new CurrentUserArgumentResolver());
        messageHandler.setCustomArgumentResolvers(resolvers);
    }
    
    // @CurrentUser 어노테이션을 위한 ArgumentResolver
    public static class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {
        
        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(com.example.apitest.annotation.CurrentUser.class);
        }
        
        @Override
        public Object resolveArgument(MethodParameter parameter, Message<?> message) throws Exception {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
            
            if (accessor != null) {
                Principal principal = accessor.getUser();
                if (principal != null) {
                    // Principal이 Authentication 타입인 경우
                    if (principal instanceof Authentication) {
                        Authentication auth = (Authentication) principal;
                        Object principalObj = auth.getPrincipal();
                        
                        if (principalObj instanceof User) {
                            return principalObj;
                        }
                    }
                    
                    // Principal의 name이 User 객체의 toString()인 경우 처리
                    // SecurityContext에서 직접 가져오기
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null && auth.getPrincipal() instanceof User) {
                        return auth.getPrincipal();
                    }
                }
            }
            
            return null;
        }
    }
}