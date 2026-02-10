package com.example.apitest.service;

import com.example.apitest.entity.User;
import com.example.apitest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * ID로 사용자 조회
     */
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }
}