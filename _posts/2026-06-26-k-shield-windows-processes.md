---
layout: post
title: "윈도우 주요 프로세스 (K-shield jr.)"
date: 2026-06-26 00:10:00 +0900
categories:
  - security
tags:
  - k-shield-junior
  - windows
  - process
notion_url: "https://app.notion.com/p/38b4b27666b080088412f69e205ccd85"
---
## 기본 개념

- 프로그램: 하드 디스크 등에 저장되어 있는 실행 코드
- 프로세스: 연속적으로 실행되고 있는 컴퓨터 프로그램의 작은 단위
- 스레드: 프로세스에서 작업의 최소 단위
- 세션: 윈도우 내 애플리케이션이 동작하기 위해 필요한 실행 공간

## 세션

- 윈도우의 세션은 일종의 사용자를 뜻하며 Session 0부터 시작한다.
- 윈도우 Vista 이전 버전에서는 처음 로그인한 사용자를 Session 0으로 정의했다.
- Vista 이후부터 Session 0은 시스템 프로세스와 서비스 실행에서만 동작하는 공간으로 정의하고, 이후 로그인 사용자에게는 각 세션 번호를 부여한다.

## 프로세스 종류: 윈도우 7

- System
  - 대부분의 커널 모드 스레드를 담당
- `smss.exe`
  - Session Manager Process 의미
  - 새로 생성되는 세션 담당
  - `csrss.exe` 프로세스 시작
  - `wininit.exe`에서 생성되는 Session 0을 초기화
  - `winlogon.exe`에서 생성되는 Session 1 이상의 새 세션을 초기화
- `wininit.exe`
  - Session 0에서 백그라운드로 실행
  - `services.exe`, `lsass.exe`, `lsm.exe` 실행
- `taskhost.exe`
  - 윈도우 작업을 위한 프로세스
  - 모든 DLL 기반 서비스나 그룹 서비스의 호스트를 제공
- `lsass.exe`
  - 로컬 보안 인증 서브시스템 서버 프로세스
  - 유저의 인증을 위한 프로세스
- `csrss.exe`
  - Client/Server Run-Time Subsystem으로 윈도우 서브시스템을 위한 유저 모드의 프로세스
  - 프로세스와 스레드 등을 관리하는 역할
- `services.exe`
  - 서비스와 작업 스케줄을 관리하는 프로세스
- `svchost.exe`
  - 윈도우 서비스의 호스트 프로세스
  - DLL을 이용한 서비스가 실행되도록 제공
  - 여러 개의 프로세스 생성 가능
- `winlogon.exe`
  - 사용자 계정의 로그온과 로그오프 상태를 관리하는 프로세스
- `explorer.exe`
  - 사용자가 파일을 접근하도록 기능을 제공하는 프로세스
- `iexplorer.exe`
  - `explorer` 프로세스로부터 실행된 프로세스

## 프로세스 종류: 윈도우 10

윈도우 7과 유사하나 추가로 주요한 프로세스가 존재한다.

- `RuntimeBroker.exe`
  - 제한된 UWP(Universal Windows Platform) 앱과 전체 Window API 간의 프록시 역할 수행
- `taskhostw.exe`
  - 윈도우 7에서 `taskhost.exe`와 역할이 동일
- `lsaiso.exe`
  - `lsass.exe`가 기능을 대부분 수행하나 계정 자격 증명을 안전하게 저장하는 중요한 역할을 할 때 사용됨
  - 원격 인증을 요구할 경우 RPC 채널을 사용하여 요청을 프록시 수행
