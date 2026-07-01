---
layout: post
title: "로그 이해와 관리 (K-shield jr.)"
date: 2026-06-26 00:07:00 +0900
categories:
  - security
tags:
  - k-shield-junior
  - linux
  - log
notion_url: "https://app.notion.com/p/38a4b27666b080979c67f4e1d9603870"
---
리눅스 초기에는 `syslog`라는 패키지를 사용하였지만, 최근 리눅스 배포판에서는 `rsyslog`로 대체되었다. `/var/log`에 각 설정별 로그 파일을 생성하여 로그를 기록한다.

## rsyslog 데몬

`rsyslog` 데몬은 syslog의 성능을 대폭 강화한 패키지이다. 멀티 스레드 지원, TCP 지원, SSL 및 TLS 지원, 데이터베이스 지원, 보내는 목록 제한, 메시지 일부 필터링 등 다양한 기능을 지원한다.

우분투 리눅스의 설정 파일은 `/etc/rsyslog.d/50-default.conf`이다.

## logrotate

로그 파일은 계속 덧붙여지면서 쌓이는 형태라 파일의 크기가 계속 커진다. 이를 방지하기 위해 로그 파일을 여러 개로 분할해주는 프로그램이 `logrotate`이다.

```shell
logrotate [option] Configuration File
```

- 자동 로테이션 기능, 압축 기능, 제거 등을 지원
- logrotate 설정 파일: `/etc/logrotate.conf`

## 주요 로그 파일

리눅스에서는 `/var/log` 디렉터리에서 시스템의 모든 로그를 기록하고 관리한다. `/etc/rsyslog.conf` 파일에서 시스템 로그 파일들의 위치를 저장하고 있다.

- `/var/log/messages`: 시스템에서 발생하는 표준 메시지가 기록되는 파일. 대부분의 로그가 이 파일에 기록되며, 일반 텍스트 형식으로 기록되어 있다.
- `/var/log/wtmp`: 사용자의 로그인/로그아웃 정보와 시스템의 Boot/Shutdown 정보에 대한 히스토리를 담고 있는 로그 파일. 바이너리 파일이기 때문에 일반적으로는 읽을 수 없고, `last` 명령어를 사용하여 확인 가능하다.
- `/var/log/btmp`: 실패한 로그인 시도에 대한 기록을 담고 있는 로그 파일. 바이너리 파일이기 때문에 일반적으로는 읽을 수 없고, `lastb` 명령어를 사용하여 확인 가능하다.
- `/var/log/lastlog`: 가장 최근에 성공한 로그인 기록을 담고 있는 로그 파일. 바이너리 파일이기 때문에 일반적으로는 읽을 수 없고, `lastlog` 명령어를 사용하여 확인 가능하다.
- `/var/log/secure`: 인증에 기반한 접속과 관련된 로그가 기록되는 로그 파일
