# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- UI Testing 기능 추가 (Playwright 기반)
- UI Testing 후 결과파일 재실행 기능
- Playwright test js file 실행 기능
- CORS 프록시 기능 추가
- API 파라미터 예시 기능
- Document 페이지 생성 및 가이드 문서 추가
- API 실행을 위한 Pipeline ID 표시
- Pipeline Step Skip 기능 추가
- Test&Report Pipeline Report 기능 추가
- Test&Report 페이지 Pipeline 테스트 기능 추가
- Meeting DM(Direct Message) 기능 추가
- 채팅 메시지 알림 기능
- 시스템 알림 기능
- 스크롤 아래 그라데이션 영역 추가
- Test history lazy loading 추가
- Login, API Key authentication 추가
- Pipeline 우클릭 삭제 및 폴더 이름 변경 기능
- Complete Pipeline System with QA-friendly Visual Interface
- Auto testing & test reporting 기능
- 요청 history 기록 및 선택 기능

### Changed
- Pipelines folder 삭제 및 수정 일반 사용자에게 권한 부여
- Frontend build 최적화
- Component file 리팩토링
- Test&Report 페이지 레이아웃 수정
- 채팅방 메시지 스크롤 개선
- Report 디자인 수정
- 스크롤 영역 UI 수정
- Login user check AOP로 추출
- Service name 변경
- 반응형 UI 개선
- Create React App에서 Vite로 마이그레이션

### Fixed
- UI Testing 사이드바 모바일 버그 수정
- UI Testing 후 결과파일 재실행시 기존 결과 제거 로직 개선
- 외부 API 호출 버그 수정
- 외부 URL 호출 버그 수정
- 모바일 파라미터 입력 라인 틀어짐 개선
- 재로그인시 401, 403 오류 출력 개선
- API Testing page > request > Headers의 Del 삭제 안됨 버그 수정
- 사이드바 폴더 및 아이템 우클릭 콘텐츠 하단 잘림 현상 수정
- Pipeline 실행 버그 수정
- Template variable modal default value handling 수정
- Pipeline folder select & add 수정
- API item delete 버그 수정
- Folder delete 버그 수정
- 채팅 안읽은 개수 카운팅 표시방법 수정

## [1.0.0] - Initial Release

### Added
- 프로젝트 초기 설정
- Frontend 서브모듈 통합
- README 및 Postman API 문서 추가
