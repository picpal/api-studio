package com.example.apitest.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.util.MultiValueMap;
import org.springframework.util.LinkedMultiValueMap;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Enumeration;
import java.util.Map;

@RestController
@RequestMapping("/api/proxy")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3002", "http://localhost:3003"}, allowCredentials = "true")
public class ProxyController {

    private final RestTemplate restTemplate = new RestTemplate();

    @RequestMapping("/**")
    public ResponseEntity<?> proxyRequest(
            HttpServletRequest request,
            @RequestBody(required = false) String body,
            @RequestParam Map<String, String> queryParams) {
        
        try {
            // 원본 URL 추출 (target 파라미터에서)
            String targetUrl = queryParams.get("target");
            if (targetUrl == null) {
                return ResponseEntity.badRequest().body("target URL is required");
            }
            
            // target 파라미터 제거
            queryParams.remove("target");
            
            // 쿼리 파라미터 추가
            if (!queryParams.isEmpty()) {
                StringBuilder urlBuilder = new StringBuilder(targetUrl);
                urlBuilder.append(targetUrl.contains("?") ? "&" : "?");
                queryParams.forEach((key, value) -> {
                    urlBuilder.append(key).append("=").append(value).append("&");
                });
                targetUrl = urlBuilder.substring(0, urlBuilder.length() - 1);
            }

            // HTTP 메서드 결정
            HttpMethod method = HttpMethod.valueOf(request.getMethod());

            // 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                if (!"host".equalsIgnoreCase(headerName) && 
                    !"origin".equalsIgnoreCase(headerName) &&
                    !"referer".equalsIgnoreCase(headerName)) {
                    headers.add(headerName, request.getHeader(headerName));
                }
            }

            // 요청 엔티티 생성
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            // 요청 전송
            ResponseEntity<String> response = restTemplate.exchange(
                URI.create(targetUrl), method, entity, String.class);

            // 응답 헤더에서 CORS 관련 헤더 제거 후 우리가 설정
            HttpHeaders responseHeaders = new HttpHeaders();
            response.getHeaders().forEach((key, value) -> {
                if (!key.toLowerCase().startsWith("access-control-")) {
                    responseHeaders.put(key, value);
                }
            });
            
            // CORS 헤더는 @CrossOrigin 어노테이션이 처리하므로 제거

            return new ResponseEntity<>(response.getBody(), responseHeaders, response.getStatusCode());

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            // CORS 헤더는 @CrossOrigin 어노테이션이 처리하므로 별도 설정 불필요
            return new ResponseEntity<>(e.getResponseBodyAsString(), HttpStatus.valueOf(e.getStatusCode().value()));
        } catch (Exception e) {
            // CORS 헤더는 @CrossOrigin 어노테이션이 처리하므로 별도 설정 불필요
            return new ResponseEntity<>("Proxy error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @RequestMapping(value = "/**", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptions() {
        // CORS 헤더는 @CrossOrigin 어노테이션이 처리하므로 별도 설정 불필요
        return new ResponseEntity<>(HttpStatus.OK);
    }
}