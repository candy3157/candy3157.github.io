---
layout: post
title: "네트워크 구성 (K-shield jr.)"
date: 2026-06-26 00:01:00 +0900
categories:
  - security
tags:
  - k-shield-junior
  - linux
  - network
notion_url: "https://app.notion.com/p/38a4b27666b0809794c3eab6587ef484"
---
## VMware 네트워크 구성 환경

VMware로 구성 시 `192.168.0.0/24`를 IP 대역으로 사용한다.

- `192.168.0.1`: Host PC의 IP 주소로 할당
- `192.168.0.2`: Gateway의 IP 주소로 할당하나 변경 가능
- `192.168.0.254`: DHCP의 IP 주소로 할당하나 변경 가능

## Linux 네트워크 설정 파일

리눅스 운영체제에서는 디바이스 형태를 포함해 대부분 파일 형태로 구성되어 있기 때문에, 네트워크 설정도 대부분 파일을 통해 관리한다.

우분투 리눅스 기준으로 주요 파일은 다음과 같다.

- `/etc/netplan/*.yaml`: 네트워크 인터페이스별 IP, 서브넷마스크, 게이트웨이 등 상세 설정 정보 수정 및 확인
- `/etc/resolve.conf`: 네트워크의 DNS 설정 정보 수정 및 확인
- `/etc/sysconfig/network`: 시스템의 호스트 네임 및 전체 기본 게이트웨이 설정
- `/etc/udev/rules.d/70-persistent-net.rules`: 실제 네트워크 인터페이스 장비가 변경되었을 때 MAC 주소와 네트워크 인터페이스 이름을 매칭하고 제어하는 파일

## 네트워크 연결 확인

구간별 네트워크 연결의 경우 각 구간에 맞는 연결 방식을 이해하고, 어떤 구역이 잘못되었는지 판단해야 한다. 이때 `ping`을 통해 ICMP 연결을 확인한다.

```bash
ping [ip주소]
```
