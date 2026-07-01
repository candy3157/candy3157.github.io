---
layout: post
title: "패키지 관리 (K-shield jr.)"
date: 2026-06-26 00:06:00 +0900
categories:
  - security
tags:
  - k-shield-junior
  - linux
  - package-management
notion_url: "https://app.notion.com/p/38a4b27666b08030b73bdccd7cf1b7a4"
---
리눅스에 사용되는 프로그램은 소스 파일을 압축하여 배포한다. 그러나 일반 사용자에게는 설치조차 어려울 수 있어 나타나게 된 것이 패키지 관리 기법이다.

주요 패키지 관리 기법은 다음과 같다.

- 레드햇: `rpm`
- 데비안: `dpkg`
- 수세: `YaST`

## rpm

```shell
rpm [option] [패키지 파일명]
```

`rpm`은 레드햇사에서 만든 패키지 관리 기법이다. 프로그램을 `.rpm` 형태의 파일로 배포하고, `rpm` 명령을 사용하여 손쉽게 설치, 갱신, 제거, 검증 등을 할 수 있다.

## yum

```shell
yum [option] [command] [패키지 파일명]
```

`yum`은 rpm 패키지 설치 시 가장 많이 발생하는 의존성 문제를 자동으로 해결해준다.

소프트웨어 저장소에 관련된 패키지들을 모아두고 네트워크를 통해 의존성을 검사하고 설치 및 업데이트를 수행한다.

## dpkg

`dpkg`는 데비안 리눅스에서 사용하는 패키지 관리 도구이다. `.deb` 형태의 파일로 배포하고, `dpkg` 명령을 사용하여 설치 및 삭제 등의 관리가 가능하다.

## apt

```shell
apt-get [option] [command] [패키지명] # 구버전
apt [option] [command] [패키지명]     # 신버전
```

`apt-get`은 데비안 리눅스 배포판에서 패키지 관리를 쉽게 하기 위해 제공되는 명령행 기반의 유틸리티로, 레드햇 기반의 `yum`과 유사하다.

주요 명령은 다음과 같다.

- `update`: 패키지 목록을 갱신할 때 사용
- `upgrade`: 모든 패키지를 최신 버전으로 갱신할 때 사용
- `install 패키지명`: 패키지를 설치할 때 사용
- `remove 패키지명`: 패키지를 삭제할 때 사용
- `clean`: 기존에 `install` 명령을 진행했을 때 생성된 파일 삭제
