---
layout: post
title: "리눅스 접근통제 기법 (K-shield jr.)"
date: 2026-06-26 00:08:00 +0900
categories:
  - security
tags:
  - k-shield-junior
  - linux
  - access-control
  - firewall
notion_url: "https://app.notion.com/p/38a4b27666b080618dcfe518ab7b7856"
---
리눅스에는 대표적으로 자체 방화벽인 `iptables`가 존재한다. 출발지 또는 목적지에 따른 프로토콜, IP 주소, 포트별 허용 및 차단 설정을 하여 접근통제를 수행한다.

## 리눅스 방화벽: iptables

```shell
iptables [-t Table] [Action] [Chain] [Match] [-j Target]
```

- 리눅스의 패킷 필터링 도구로서 방화벽 구성이나 NAT에 사용한다.
- 패킷에 대한 동작은 위에서부터 차례로 각 규칙에 대해 검사한다.
- 규칙과 일치하는 패킷에 대해 `ACCEPT`, `DROP` 등을 수행한다.
- 패킷이 체인의 모든 규칙과 매치되지 않으면 정해진 기본 정책을 수행한다.
  - 기본 정책은 `policy ACCEPT`로 설정되어 있으나, 기본 정책을 `DROP`으로 설정하고 `ACCEPT`할 포트와 IP 주소를 설정하여 사용해야 한다.

## iptables 옵션

- Table: `filter`, `nat` 등
- Chain: filter 테이블에 미리 정의된 세 가지 체인
  1. `INPUT`: 호스트 컴퓨터를 향한 모든 패킷
  2. `OUTPUT`: 호스트 컴퓨터에서 발생하는 모든 패킷
  3. `FORWARD`: 호스트 컴퓨터가 목적지가 아닌 모든 패킷, 즉 라우터로 사용되는 호스트 컴퓨터를 통과하는 패킷

## Action

- `-A (--append)`: 새로운 규칙 추가
- `-D (--delete)`: 규칙 삭제
- `-C (--check)`: 패킷 테스트
- `-R (--replace)`: 기존의 규칙을 새로운 규칙으로 변경
- `-I (--insert)`: 새로운 규칙을 삽입
- `-L (--list)`: 현재 설정된 규칙 출력
- `-F (--flush)`: Chain으로부터 모든 설정 삭제
- `-Z (--zero)`: 모든 Chain의 패킷과 바이트 카운터 값을 0으로 설정
- `-N (--new)`: 새로운 Chain 생성
- `-X (--delete-chain)`: Chain 삭제, 기본 체인 제외
- `-P (--policy)`: 기본 정책 변경

## Match

Match는 iptables에서 패킷을 처리할 때 만족해야 하는 조건이다.

- `--source (-s)`: 출발지 IP 주소나 네트워크와의 매칭
- `--destination (-d)`: 목적지 IP 주소나 네트워크와의 매칭
- `--protocol (-p)`: 특정 프로토콜과의 매칭
- `--in-interface (-i)`: 입력 인터페이스
- `--out-interface (-o)`: 출력 인터페이스
- `--state`: 연결 상태와의 매칭
- `--string`: 애플리케이션 계층 데이터 바이트 순서와의 매칭
- `--comment`: 커널 메모리 내의 규칙과 연계되는 최대 256바이트 주석
- `--syn (-y)`: SYN 패킷을 비허용
- `--fragment (-f)`: 두 번째 이후의 조각에 대해서 규칙을 명시
- `--table (-t)`: 처리될 테이블
- `--jump (-j)`: 규칙에 맞는 패킷을 어떻게 처리할 것인가 명시
- `--match (-m)`: 특정 모듈과의 매치

## Target

- `ACCEPT`: 패킷을 허용함
- `DROP`: 패킷을 버림
- `RETURN`: 호출 체인 내에서 패킷 처리를 계속 수행

## iptables 사용 방법

현재 설정된 iptables 규칙 확인:

```shell
iptables --list
iptables -L
```

현재 설정된 iptables 규칙 저장:

```shell
service iptables save
iptables-save > firewall.sh
```

저장된 iptables 규칙 불러오기:

```shell
iptables-restore < firewall.sh
```

특정 IP, 포트 차단 및 허용 관련 규칙 적용과 삭제:

```shell
iptables -I INPUT -s x.x.x.x -j DROP
iptables -A INPUT -s x.x.x.x -j ACCEPT
iptables -A INPUT -p tcp --dport port_number -j DROP
iptables -A INPUT -p tcp -s x.x.x.x --dport port_number -j ACCEPT
iptables -D INPUT -p tcp -s x.x.x.x --dport port_number -j ACCEPT
```

## TCP Wrapper

TCP Wrapper는 임의의 호스트로부터 서비스 요청이 오면 실제 데몬을 구동하기 전에 접속을 허용한 시스템인지 여부를 확인하여 로그에 기록한다.

- FTP, Telnet, SSH 기반의 서비스 등에 대한 접근제어 가능
- 설정 파일
  - `/etc/hosts.allow`
  - `/etc/hosts.deny`
