package com.example.apitest.service;

import com.example.apitest.dto.UserDTO;
import com.example.apitest.entity.User;
import com.example.apitest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    
    /**
     * 채팅 가능한 사용자 목록 조회
     * - 승인된 사용자만
     * - 현재 사용자 제외
     */
    public List<UserDTO> getAvailableUsersForChat(Long currentUserId) {
        log.debug("채팅 가능한 사용자 목록 조회: currentUserId={}", currentUserId);
        
        List<User> users = userRepository.findAll();
        
        return users.stream()
            .filter(user -> !user.getId().equals(currentUserId)) // 현재 사용자 제외
            .filter(user -> User.Status.APPROVED.equals(user.getStatus())) // 승인된 사용자만
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * ID로 사용자 조회
     */
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }
    
    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
            .id(user.getId())
            .email(user.getEmail())
            .role(user.getRole())
            .status(user.getStatus())
            .createdAt(user.getCreatedAt())
            .build();
    }
}