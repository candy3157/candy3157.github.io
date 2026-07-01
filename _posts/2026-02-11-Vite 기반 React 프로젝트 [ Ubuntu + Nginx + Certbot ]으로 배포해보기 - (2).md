---
layout: post
title: "Vite 기반 React 프로젝트 [ Ubuntu + Nginx + Certbot ]으로 배포해보기 - (2)"
date: 2026-02-11 01:10:00 +0900
categories:
  - dev
tags:
  - linux
  - nginx
  - server
  - dns
  - security
  - dev
---

[vite-기반-react-프로젝트-ubuntu-nginx-certbot-으로-배포해보기-1-도메인-공유기-서버-세팅](http://candy3157.github.io/vite-기반-react-프로젝트-ubuntu-nginx-certbot-으로-배포해보기-1-도메인-공유기-서버-세팅.html "이전 편")

위 글에서 이어지는 내용입니다.

---

정적 웹 프로젝트인 LinkHub를 개인적으로 갖고 있는 미니 PC에 만들어둔 Ubuntu 서버에 Nginx로 배포했다. 처음 하는 사람 기준에서 정리해봤다.

### 📌 목차

- 왜 이 방식으로 배포했을까?
- 최종 구조
- 서버 초기 세팅 (Nginx, 방화벽, 도메인)
- 빌드 결과(dist) + 배포 방식(rsync)
- HTTPS 적용

---

### 왜 이 방식으로 배포했을까?

내 목표는 두 가지였다.

1.  정적 파일은 빠르고 단순하게 `Nginx`로 서빙
2.  배포 후 바뀔 수 있는 데이터(`links.json`)는 서버에서 바로 수정 가능하게 운영

즉, UI 코드가 바뀌면 재빌드/재배포하고, 그 외의 내용은 `links.json`만 수정해서 반영하는 구조이다.

---

### 최종 구조

- 웹 루트 : `/var/www/linkhub/site`
- 배포용 임시 폴더 : `/var/www/linkhub/release`
- Taildrop 수신 폴더 : `/var/www/linkhub/inbox` (따로 FTP나 sftp를 사용하지 않고 Tailwind를 사용하여 파일을 전송했기 때문)
- 런타임 데이터 파일 : `links.json`

브라우저 흐름

1.  `https://도메인` 접속
2.  Nginx가 `index.html` + `assets` 반환
3.  프론트가 `links.json` 요청
4.  서버의 최신 `links.json` 값으로 화면 렌더

---

### 서버 초기 세팅

### 1) 서버 기본 세팅

```
sudo apt update    // APT 패키지 목록 최신화
sudo apt install -y nginx certbot    // -y : 자동 승인
    // 필수 패키지 설치
    // nginx(웹서버), certbot(SSL 발급도구), python3-certbot-nginx(Nginx 자동 https 설정 플러그인)
    // unzip(zip 파일 압축 해제), rsync(파일 동기화/배포용)

sudo systemstl enable nginx    // 자동 재부팅 시 자동 실행 설정(systemd에 등록)
sudo systemctl start nginx    // 바로 Nginx 실행
```

### 2) Nginx 설정

`/etc/nginx/nginx.conf`

ex) 아래의 내용은 실제 파일의 내용이 아닌 예시다

```
server {
    listen 80;
    listen [::]:80;
    server_name candy3157.cloud www.candy3157.cloud;

    root /var/www/linkhub/site;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /links.json {
        alias /var/www/linkhub-data/links.json;
        default_type application/json;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        expires -1;
    }

    location = /favicon.ico {
        try_files $uri =204;
        access_log off;
        log_not_found off;
    }
}
```

활성화 :

```
sudo ln -s /etc/nginx/sites-available/linkhub /etc/nginx/sites-enabled/linkhub
    // 설정 파일 활성화(심볼릭 링크 생성) | ln -s : symbolic link(바로가기)를 만드는 명령어
```

`/etc/nginx/sites-available` -> 설정 파일 저장 위치  
`/etc/nginx/sites-enabled` -> 실제로 적용할 설정  
즉, `sites-available`에 설정 파일을 만들어두고, `sites-enabled`에 링크가 있어야만 적용이 됨

```
sudo nginx -t    // nginx 설정 파일 문법 검사 | 정상일 경우 succesful 출력
sudo systemctl reload nginx    // 설정 적용 | 리로드
```

---

### 빌드 결과(dist) + 배포 방식(rsync)

### 로컬에서 빌드 + zip 만들기

```
npm run build
```

위 명령어를 실행시키면 프로젝트의 루트 경로에 `dist` 파일이 생성되는데, 이게 서버에 배포되는 파일이다  
그리고 나의 경우 그 파일을 압축시켜서 서버에 전송했다.

보통 파일을 전송할 때 `FTP`나 `sFTP`를 사용하는데 나는 이미 `Tailscale`이라는 **Mesh VPN**을 사용중이었기 때문에 `Tailscale`에서 제공하는 파일 전송 서비스를 이용했다.

### Taildrop으로 서버에 전송

```
tailscale file cp dist경로 서버명:    // 데스크탑에서 실행
```

```
mkdir -p /var/www/linkhub/inbox /var/www/linkhub/release    // 파일 수신 디렉터리(inbox)와 배포용 임시 디렉터리(release) 생성
tailscale file get /var/www/linkhub/inbox    // 파일 수신 디렉터리에 dist 수신
ls -lh /var/www/linkhub/inbox    // 파일 수신 확인
```

### 압축 해제 + 배포 반영

```
unzip -o ~/deploy/linkhub/inbox/dist.zip -d /var/www/linkhub/release    // -o : 기존 파일 덮어쓰기 | -d : 압축 해제 경로 지정
sudo rsync -av --delete /var/www/linkhub/release/dist/ /var/www/linkhub/site/    // -a : archive모드 | -v : verbose 출력
                                                                                 //--delete : 기존에 있고 새 빌드에 없는 파일 삭제
sudo chown -R www-data:www-data /var/www/linkhub/site
sudo find /var/www/linkhub/site -type d -exec chmod 755 {} \;
sudo find /var/www/linkhub/site -type f -exec chmod 644 {} \;
sudo nginx -t && sudo systemctl reload nginx
```

`unzip -o ~/deploy/linkhub/inbox/dist.zip -d /var/www/linkhub/release`  
\-> `dist.zip`을 `/var/www/linkhub/release` 경로에 압축 해제

`sudo rsync -av --delete /var/www/linkhub/release/dist/ /var/www/linkhub/site/`  
\-> 서비스 디렉터리를 빌드 내용과 정확히 일치시키는 작업  
⚠️중요⚠️  
`dist/` -> 내부 내용만 복사

`sudo find /var/www/linkhub/site -type d -exec chmod 755 {} \;`  
\-> 디렉터리 권한 설정 | 755 -> 소유자:rw- 그룹/기타:r-x  
`sudo find /var/www/linkhub/site -type f -exec chmod 644 {} \;`  
\-> 파일 권한 설정 | 755 -> 소유자:rw- 그룹/기타:r--  
위 조합이 웹 서버 표준 권한 설정이라고 함

`sudo nginx -t && sudo systemctl reload nginx`  
\-> 설정 검사 + 반영

### 전체 배포 흐름

```
1. 빌드 압축 풀기
2. 서비스 디렉터리 동기화
3. 소유권 설정
4. 권한 설정
5. nginx 적용 후 리로드
```

⚠️위 과정이 끝나고 나면 `/var/www/linkhub/site` 경로 바로 아래에 `index.html`이 있어야 함⚠️

---

### HTTPS 적용

```
sudo certbot --nginx -d candy3157.cloud -d www.candy3157.cloud
```

`certbot`과 `Nginx 플러그인`을 사용하여`candy3157.cloud`과 `www.candy3157.cloud`의 도메인에 하나의 인증서를 포함하게 함
