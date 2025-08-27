package com.example.apitest.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 로그인 인증이 필요한 메소드에 사용하는 어노테이션
 * AOP를 통해 세션 체크를 자동으로 수행합니다.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireAuth {
    /**
     * 관리자 권한이 필요한지 여부
     */
    boolean adminOnly() default false;
}