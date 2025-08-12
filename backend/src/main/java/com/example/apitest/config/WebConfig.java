package com.example.apitest.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private ActivityLoggingInterceptor activityLoggingInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(activityLoggingInterceptor)
                .addPathPatterns("/api/**")  // API 경로만 인터셉트
                .excludePathPatterns(
                    "/api/auth/**",          // 인증 관련은 AuthController에서 직접 처리
                    "/api/auth/validate-password", // 비밀번호 검증은 로깅하지 않음 (보안상)
                    "/api/admin/activities/export", // Excel 다운로드는 로깅하지 않음
                    "/error"                 // 에러 페이지 제외
                );
    }
}