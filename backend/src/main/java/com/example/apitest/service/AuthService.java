package com.example.apitest.service;

import com.example.apitest.entity.User;
import com.example.apitest.repository.UserRepository;
import com.example.apitest.service.PasswordValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordValidationService passwordValidationService;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User register(String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        }

        // User 엔티티 생성 및 안전한 비밀번호 설정
        User user = new User();
        user.setEmail(email);
        user.setPasswordSafely(password); // 이 메서드에서 ISMS 검증과 암호화를 모두 처리
        
        return userRepository.save(user);
    }

    public Optional<User> login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                if (user.getStatus() == User.Status.APPROVED) {
                    // 비밀번호 만료 검사
                    if (user.isPasswordExpired() || user.getForcePasswordChange()) {
                        throw new RuntimeException("비밀번호가 만료되었습니다. 비밀번호를 변경해주세요.");
                    }
                    
                    // 비밀번호 만료 임박 경고 (로그인은 허용하되 경고 메시지)
                    if (user.isPasswordExpiringSoon()) {
                        // 로그인은 성공하되, 클라이언트에서 경고 메시지를 보여줄 수 있도록 플래그 설정
                        // 실제로는 별도의 응답 객체나 세션 속성으로 처리
                    }
                    
                    return Optional.of(user);
                } else if (user.getStatus() == User.Status.PENDING) {
                    throw new RuntimeException("계정이 승인 대기 중입니다. 관리자 승인을 기다려주세요.");
                } else {
                    throw new RuntimeException("계정이 거부되었습니다. 관리자에게 문의하세요.");
                }
            }
        }
        return Optional.empty();
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * 비밀번호 변경 (이력 관리 포함)
     */
    public void changePassword(String email, String oldPassword, String newPassword) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("사용자를 찾을 수 없습니다.");
        }
        
        User user = userOpt.get();
        
        // 현재 비밀번호 확인
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("현재 비밀번호가 올바르지 않습니다.");
        }
        
        // User 엔티티의 안전한 비밀번호 설정 메서드 사용
        // 이 메서드에서 ISMS 검증, 이력 검사, 암호화를 모두 처리
        user.setPasswordSafely(newPassword);
        
        userRepository.save(user);
    }
    
    /**
     * 관리자에 의한 강제 비밀번호 변경
     */
    public void forcePasswordChange(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("사용자를 찾을 수 없습니다.");
        }
        
        User user = userOpt.get();
        user.setForcePasswordChange(true);
        userRepository.save(user);
    }
    
    /**
     * 비밀번호 만료 확인
     */
    public boolean isPasswordExpired(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (!userOpt.isPresent()) {
            return false;
        }
        
        User user = userOpt.get();
        return user.isPasswordExpired() || user.getForcePasswordChange();
    }
}