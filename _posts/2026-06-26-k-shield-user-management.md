---
layout: post
title: "사용자 이해과 관리 (K-shield jr.)"
date: 2026-06-26 00:04:00 +0900
categories:
  - security
tags:
  - k-shield-junior
  - linux
  - user-management
notion_url: "https://app.notion.com/p/38a4b27666b08087bab6fb3d9781f53b"
---
각 사용자의 권한은 일반 사용자 또는 root 사용자 중 하나로 정의된다.

일반 사용자는 실행할 수 있는 퍼미션을 가진 파일에만 접근이 가능하고, root 사용자는 소유 여부에 관계없이 모든 파일에 접근할 수 있다.

## 사용자 관련 파일

- `/etc/passwd`: 계정 이름과 관련 정보
- `/etc/shadow`: 패스워드와 관련 정보
- `/etc/group`: 계정 그룹과 보조 그룹 계정 정보

## 사용자 계정 생성

```shell
adduser
useradd
```

`adduser` 실행 절차는 다음과 같다.

1. `/etc/passwd`와 `/etc/shadow`에 사용자 추가
2. 사용자명과 동일하게 `/etc/group`에 추가
3. `/home/<사용자명>` 디렉터리 생성
4. `/etc/skel` 디렉터리 파일을 사용자 홈 디렉터리에 복사

## 사용자 삭제

```shell
userdel
```

## 사용자 암호 변경

```shell
passwd
```
