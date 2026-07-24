# 틈펴 배포 안내

백그라운드 푸시가 브라우저 탭이 닫힌 뒤에도 작동하려면 HTTPS 주소에서 서버가 계속 실행되어야 합니다.

## 필수 조건

- Node.js 22 이상 또는 Docker
- HTTPS를 제공하는 호스팅
- 재시작 후에도 유지되는 영구 디스크
- `VAPID_PRIVATE_KEY`를 노출하지 않는 비밀 환경변수

## 환경변수

`.env.example`을 기준으로 설정합니다. 운영 환경에서는 VAPID 공개·비밀 키를 환경변수로 고정해야 기존 브라우저 구독이 서버 재배포 뒤에도 유지됩니다. `DATA_DIR`은 영구 디스크 경로로 지정합니다.

## Docker 실행

```sh
docker build -t teumpyeo .
docker run -p 4187:4187 -v teumpyeo-data:/data --env-file .env teumpyeo
```

배포 후 `/health`가 `status: ok`로 응답하는지 확인합니다. 브라우저 푸시 구독은 HTTPS에서만 허용되며 `localhost`는 개발 예외입니다.

## 운영 확인 항목

1. 서버가 절전 없이 계속 실행되는지 확인
2. `/data`가 재배포 후에도 유지되는지 확인
3. 브라우저 알림 권한과 운영체제 방해 금지 설정 확인
4. VAPID 비밀 키를 저장소나 클라이언트 코드에 포함하지 않기
5. 실제 학생 사용 전 개인정보 처리방침과 보호자 동의 절차 검토
