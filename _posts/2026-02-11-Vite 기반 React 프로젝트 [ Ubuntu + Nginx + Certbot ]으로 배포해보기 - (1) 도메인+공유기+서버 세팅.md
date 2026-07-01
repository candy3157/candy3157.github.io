---
layout: post
title: "Vite 기반 React 프로젝트 [ Ubuntu + Nginx + Certbot ]으로 배포해보기 - (1) 도메인+공유기+서버 세팅"
date: 2026-02-11 00:30:00 +0900
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

이 글은 실제로 내가 쓰고 있는 환경을 기반으로 작성되었으며, 나중에 내가 보기 위해서 기록하는 글이다.  
Ubuntu 서버는 miniPC에 설치되어 있고, 원룸이기 때문에 desktop과 miniPC에 인터넷을 연결하기 위해선 공유기 연결이 필수였다.

내가 배포를 하기 위해서는 다음의 과정을 거쳐야했다.

1. 도메인 구매하기
2. 공유기에 DDNS 적용하기
3. 가비아 DNS를 사용해서 DDNS와 연결하기  
   4\. 포트포워딩 하기  
   5\. Ubuntu 서버에서 방화벽 설정

---

### 1) 도메인 구매하기

도메인은 [가비아](https://google.com "Gabia")에서 구매했다. `candy3157.cloud` 라는 도메인이었고, 이벤트로 1년에 만원 안되는 돈으로 구매했던 것 같다.

---

### 2) 공유기에 DDNS 적용하기

![ddns]({{ '/assets/images/posts/2026-02-11-Vite 기반 React 프로젝트 [ Ubuntu + Nginx + Certbot ]으로 배포해보기 - (1) 도메인+공유기+서버 세팅/ddns.png' | relative_url }})

내 공유기는 LG U+ 공유기였기 때문에 지원하는 DDNS에 한계가 있었다.  
그래도 그 중에 무료로 쓸 수 있으면서 가장 유명한 noip([https://www.noip.com/](https://www.noip.com/))가 있었다. 그래서 난 그곳을 사용했고 공유기에 ddns를 성공적으로 사용할 수 있었다.

#### 🤔DDNS는 왜 쓰는건데?🤔

\-> 원룸이나 보통 아파트의 IP는 유동IP이기 때문에 IP가 계속 바뀌게된다. 그렇기 때문에 DDNS라는 고정된 도메인에 계속 바뀌는 우리의 IP를 자동으로 할당해주는 서비스를 제공하는 곳이 noip라는 업체인 것이다.

---

### 3) 가비아 DNS를 사용해서 DDNS와 연결하기

가비아 도메인 구매 후 네임서버 설정 등은 구글에 검색하면 잘 나오니 생략하겠다.(나의 경우 가비아 기본 네임서버를 사용중이다.)

![ddns]({{ '/assets/images/posts/2026-02-11-Vite 기반 React 프로젝트 [ Ubuntu + Nginx + Certbot ]으로 배포해보기 - (1) 도메인+공유기+서버 세팅/dns.png' | relative_url }})

위와 같이 DNS설정에서 호스트를 @와 www를 등록해주면 [candy3157.cloud,](http://candy3157.cloud.net,) [www.candy3157.cloud](http://www.candy3157.cloud.net) 처럼 "www"가 붙든 안붙든 나의 도메인으로 들어올 수 있게끔 등록하는 절차이다.

이렇게 해주면 가비아에서 구매한 candy3157.cloud 에다가 공유기의 DDNS인 ~~.ddns.net을 연결한것이다

```
candy3157.cloud  (가비아)
        │ CNAME
        ▼
~~~.ddns.net    (no-ip)
        │ DDNS
        ▼
현재 공인 IP
        │
LG U+ 공유기 (포트포워딩)
        │
Ubuntu 서버 (Nginx)
```

> 만약 나중에 프로젝트를 하나 더 만들어서 앞에 ex.candy3157.cloud을 도메인으로 사용하고 싶다면 호스트에 ex를 추가해주면 된다.

---

### 4) 포트포워딩 하기

![ddns]({{ '/assets/images/posts/2026-02-11-Vite 기반 React 프로젝트 [ Ubuntu + Nginx + Certbot ]으로 배포해보기 - (1) 도메인+공유기+서버 세팅/port_forwarding.png' | relative_url }})

공유기 내부 설정에서 이제 웹 서비스에서 사용하는 port 번호인 80번과 443번 포트를 내 miniPC 서버에 포트포워딩을 시켜주어야 한다.

위 처럼 설정해주면  
candy3157.cloud 라는 도메인에 80번이나 443번 포트를 사용해서 접속 -> 192.168.219.101(공유기 내부 miniPC)의 80번과 443번 포트에 연결해주세요.  
라는 말이 된다.

---

### 5) Ubuntu 서버에서 방화벽 설정

```
sudo ufw allow 80
sudo ufw allow 443
sudo ufw reload
sudo ufw status

sudo ss -tlnp | grep -E ':80|:443'	// 80|443 포트가 리슨중인지 확인
```

위의 명령어를 모두 실행한다면 Ubuntu 서버의 80, 443번 포트를 방화벽에서 개방해준 것이다.

---

## 마무리

위 과정이 모두 끝났다면 도메인과 Ubuntu 서버와 연결은 끝났고, 이제 웹 프로젝트와 연결해주는 친구인 Nginx를 설정해서 해당 도메인으로 응답 해주도록 Server Block을 설정해주면 된다.
