package com.example.apitest.config;

import com.example.apitest.entity.User;
import com.example.apitest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) throws Exception {
        // 관리자 계정이 없으면 생성
        if (userRepository.findByEmail("admin@blue.com").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@blue.com");
            
            // ISMS 규격에 맞는 강력한 초기 비밀번호 설정
            // 영문 대소문자 + 숫자 + 특수문자 조합, 8자 이상
            String adminPassword = "Admin!2024@Blue";
            
            // 직접 암호화된 비밀번호 설정 (admin 계정 초기 생성 시에는 검증 건너뛰기)
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(User.Role.ADMIN);
            admin.setStatus(User.Status.APPROVED);
            
            userRepository.save(admin);
            System.out.println("Admin user created: admin@blue.com / " + adminPassword);
            System.out.println("*** 중요: 초기 로그인 후 반드시 비밀번호를 변경하세요! ***");
        }
    }
}