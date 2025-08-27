package com.example.apitest.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * API 키 기반 인증과 폴더 권한이 필요한 메소드에 사용하는 어노테이션
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireApiAuth {
    /**
     * 폴더 ID를 가져올 파라미터 이름 (예: "folderId")
     * 이 파라미터 값으로 API 키의 폴더 접근 권한을 체크합니다.
     */
    String folderParam() default "folderId";
    
    /**
     * 관리자 권한이 필요한지 여부
     */
    boolean adminOnly() default false;
}