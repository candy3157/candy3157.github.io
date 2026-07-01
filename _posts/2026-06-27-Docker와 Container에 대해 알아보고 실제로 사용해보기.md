---
layout: post
title: "Docker와 Container에 대해 알아보고 실제로 사용해보기"
date: 2026-06-27 00:03:00 +0900
categories:
  - dev
  - security
tags:
  - docker
  - linux
  - container
---

# 1. Container란 무엇인가?

## 개념

> 애플리케이션이 한 컴퓨팅 환경에서 다른 컴퓨팅 환경으로 빠르고 안정적으로 실행될 수 있도록 코드와 모든 종속성을 패키징 하는 표준 소프트웨어 단위

## 탄생 배경

### 가상화 이전 - 물리 서버 시대

2000년대 초까지는 하드웨어에 직접 OS와 Application을 설치하는 방식이 일반적이었다.

서버 성능이 부족하면 더 좋은 장비로 교체하는 **Scale Up** 방식으로 대응했는데, 이 방식은 두 가지 문제가 있었다.

- 장비 구매 비용이 크고, 교체할 때마다 OS부터 Application까지 **처음부터 다시 세팅**해야 했다.
- 서버가 1대뿐이라면, 장애 발생 시 **서비스 전체가 중단**된다. 이를 방지하려면 이중화가 필요한데, 비싼 서버를 2대 이상 구성하는 것은 상당한 비용 부담이었다.

### 가상화 시대 — Virtual Machine의 등장

2001년, VMware가 가상화 솔루션을 출시하면서 본격적인 가상화 시대가 열렸다.

**Virtual Machine(VM)** 은 하나의 물리 서버에서 CPU, Memory 등의 자원을 논리적으로 격리할 수 있다.
예를 들어 10개의 서비스가 있다면, VM을 10개 만들어 자원을 10%씩 분배하면 된다. 이를 통해 다음 두 가지 문제를 해결할 수 있었다.

- **서비스 격리** — 한 서비스에 문제가 생겨도 다른 서비스에 미치는 영향 최소화
- **이중화** — 한 대의 물리 서버에서 여러 VM을 운용하므로 비용 부담 감소

하지만 VM에도 단점이 있었다. 서비스 10개를 운영하려면 **OS도 10개**가 필요했다. 서비스마다 독립적인 Guest OS를 띄워야 했기 때문에, OS가 차지하는 메모리·디스크·CPU가 서비스 수에 비례해 늘어나는 **자원 낭비**가 발생했다.

![감자서버]({{ '/assets/images/posts/2026-06-27-Docker와 Container에 대해 알아보고 실제로 사용해보기/감자서버.png' | relative_url }})

### 컨테이너 시대 — Docker의 등장

VM의 자원 낭비 문제를 해결하기 위해 **Container** 환경이 등장했다.

Docker와 같은 컨테이너 환경은 Host OS 위에 격리된 레이어를 구축하여, **하나의 OS에서 다수의 서비스를 독립적으로 실행**할 수 있게 한다.

|             | 물리 서버 | VM            | Container |
| ----------- | --------- | ------------- | --------- |
| OS 수       | 1개       | 서비스 수만큼 | 1개(공유) |
| 자원 격리   | X         | O             | O         |
| 자원 효율성 | 보통      | 낮음          | 높음      |
| 이중화      | 비용 큼   | 비용 낮음     | 비용 낮음 |

Container는 **VM의 장점(서비스 격리, 이중화)은 유지하면서, VM의 단점(자원 낭비)은 해결한** 모델이라고 할 수 있다

![image]({{ '/assets/images/posts/2026-06-27-Docker와 Container에 대해 알아보고 실제로 사용해보기/image.png' | relative_url }})

**Container**는 기존의 VM의 구조에서 **중복되는 OS를 제거**하고 모든 Container가 하나의 OS를 공유하게 하여, OS가 먹던 자원 대부분을 소비하지 않게 된다. 그렇기 때문에 VM에 비해 매우 가벼워지기까지 했다.

## Container는 어떻게 실행할까?

위에서 Container가 얼마나 좋은 녀석인지 알아보았다. 그렇다면 이 좋은걸 우리는 어떻게 사용할 수 있을까?

![좋은녀석]({{ '/assets/images/posts/2026-06-27-Docker와 Container에 대해 알아보고 실제로 사용해보기/좋은녀석.png' | relative_url }})

이를 이해하려면 **“Image”**와 **“Container”**라는 두 가지 핵심 개념을 먼저 알아야 한다.

### Docker Image(이미지)

도커에서 **서비스 운영에 필요한 서버 프로그램, 소스코드, 및 라이브러리, 컴파일된 실행 파일을 묶는 형태**를 **“Docker Image”**라 한다. 즉, **컨테이너 생성에 필요한 모든 파일과 설정값(환경)을 지닌 것**으로, 더이상 의존성 파일을 컴파일하거나 이것저것 설치할 필요 없는 상태의 파일을 의미한다.

### Docker Container(컨테이너)

**이미지(Image)를 실행한 상태**로, 응용프로그램의 종속성과 함께 응용프로그램 자체를 패키징 or 캡슐화하여 격리된 공간에서 프로세스를 동작시키는 기술이다.

### Image와 Container의 관계

이미지와 컨테이너의 관계를 비유하자면, 이미지는 “붕어빵 틀”, 컨테이너는 “붕어빵”이다.

하나의 틀로 여러 개의 같은 붕어빵을 만들 수 있듯이, **동일한 이미지로 여러개의 컨테이너를 실행할 수 있다**. 그리고 이미지는 아무리 컨테이너를 만들어도 변하지 않는다.

언제든지 동일한 이미지로 똑같은 컨테이너를 실행할 수 있다. 이 덕분에 “내 컴퓨터에서는 되는데 서버에서는 안되네?” 와 같은 **환경으로 인한 충돌을 막을 수 있다**는 장점이 있다.

---

# 2. Docker란 무엇인가?

## 개념

> 애플리케이션을 신속하게 구축, 테스트, 배포할 수 있는 **컨테이너** 기반의 오픈소스 가상화 플랫폼

## Docker 아키텍처

Docker는 단순히 명령어 하나로 컨테이너를 실행하는 것처럼 보이지만, 내부적으로는 여러 구성요소가 통신하며 동작한다. Docker의 아키텍처는 크게 새 가지로 나뉜다.

1. Docker Client
   - 우리가 터미널에서 입력하는 `docker run`, `docker pull`같은 명령어가 바로 Docker Client다. Client는 사용자의 명령을 받아 Docker Daemon에게 전달하는 역할을 한다. 즉 Client 자체가 컨테이너를 실행하거나 이미지를 관리하는 것이 아닌, 요청을 전달하는 창구 역할이다.
2. Docker Daemon
   - Docker의 핵심이다. Client로부터 요청을 받아 실제로 이미지를 관리하고, 컨테이너를 생성하고, 실행하고, 삭제하는 일련의 모든 과정을 처리한다. Docker Daemon은 백그라운드에서 항상 실행되고 있으며, 요청을 기다리고 있다.
3. Docker Registry
   - 이미지를 저장하고 배포하는 저장소다. Docker Daemon이 이미지가 필요할 때 Registry에서 가져온다(pull). 대표적인 Registry는 Docker에서 공식으로 운영하는 Docker Hub(Github랑 비슷함)가 있다.

![img1.daumcdn]({{ '/assets/images/posts/2026-06-27-Docker와 Container에 대해 알아보고 실제로 사용해보기/img1.daumcdn.png' | relative_url }})

# Docker 핵심 명령어

## Image 관련 명령어

| 명령어                   | 설명                                 |
| ------------------------ | ------------------------------------ |
| `docker pull [이미지명]` | Registry에서 Image를 로컬로 가져온다 |
| `docker images`          | 로컬에 저장된 Image 목록을 확인한다  |
| `docker rmi [이미지명]`  | 로컬에 저장된 Image를 삭제한다       |

```bash
# nginx 이미지를 Docker Hub에서 가져오기
docker pull nginx

# 로컬에 저장된 이미지 목록 확인
docker images

# nginx 이미지 삭제
docker rmi nginx
```

## Container 관련 명령어

| 명령어                              | 설명                                           |
| ----------------------------------- | ---------------------------------------------- |
| `docker run [이미지명]`             | Image를 기반으로 Container를 생성하고 실행한다 |
| `docker ps`                         | 실행 중인 Container 목록을 확인한다            |
| `docker ps -a`                      | 중지된 Container를 포함한 전체 목록을 확인한다 |
| `docker stop [컨테이너명]`          | 실행 중인 Container를 중지한다                 |
| `docker rm [컨테이너명]`            | Container를 삭제한다                           |
| `docker exec -it [컨테이너명] bash` | 실행 중인 Container 내부로 접속한다            |

```bash
# nginx 컨테이너 실행
docker run nginx

# 실행 중인 컨테이너 목록 확인
docker ps

# 전체 컨테이너 목록 확인 (중지된 것 포함)
docker ps -a

# 컨테이너 중지
docker stop my-nginx

# 컨테이너 삭제
docker rm my-nginx

# 컨테이너 내부 접속
docker exec -it my-nginx bash
```

`docker run` 은 단독으로 쓰기보다 여러 옵션과 함께 사용하는 경우가 많다.

| 옵션     | 설명                                                   |
| -------- | ------------------------------------------------------ |
| `-d`     | 백그라운드에서 실행한다 (detached mode)                |
| `--name` | Container에 이름을 붙인다                              |
| `-it`    | Container 내부에 직접 접속하여 명령어를 입력할 수 있다 |

```bash
# 백그라운드 실행 + 이름 지정
docker run -d --name my-nginx nginx
```

| 명령어                        | 설명                                   |
| ----------------------------- | -------------------------------------- |
| `docker logs [컨테이너명]`    | Container의 로그를 확인한다            |
| `docker logs -f [컨테이너명]` | Container의 로그를 실시간으로 확인한다 |
| `docker inspect [컨테이너명]` | Container의 상세 정보를 확인한다       |

```bash
# 컨테이너 로그 확인
docker logs my-nginx

# 실시간 로그 확인
docker logs -f my-nginx

# 컨테이너 상세 정보 확인
docker inspect my-nginx
```

## 포트바인딩

Container는 **기본적으로 외부와 격리된 환경에서 실행**된다. 즉, Container 내부에서 서버가 실행되고 있더라도 외부에서는 접근할 수 없다. 이 문제를 해결하는 것이 바로 **포트바인딩**이다.

![포트바인딩_짤]({{ '/assets/images/posts/2026-06-27-Docker와 Container에 대해 알아보고 실제로 사용해보기/포트바인딩_짤.png' | relative_url }})

포트바인딩은 Host(내 컴퓨터)의 포트와 Container의 포트를 연결하는 것이다.

```bash
docker run -p [호스트 포트]:[컨테이너 포트] [이미지명]
```

예를들어 nginx Container(웹 프로젝트에서 많이 사용함)는 기본적으로 80번 포트에서 실행된다.

하지만 Container가 격리되어있기 때문에 호스트에서 브라우저를 통해 바로 접근할 수 없다.

아래와 같이 포트바인딩을 해주면 접근이 가능해진다.

```bash
docker run -d -p 8080:80 nginx
```

이 명령어는 **Host의 8080 포트**로 들어오는 요청을 **Container의 80 포트**로 전달하라는 의미다. 즉, 브라우저에서 `localhost:8080` 으로 접속하면 Container 안에서 실행 중인 nginx에 접근할 수 있게 된다.

```
브라우저 → localhost:8080 → [Host 8080] → [Container 80] → nginx
```

포트바인딩은 여러 개를 동시에 설정하는 것도 가능하다

```bash
docker run -d -p 8080:80 -p 443:443 nginx
```

---

# 3. Docker 실습

## Dockerfile이란?

> 이미지를 만들기 위한 명령어들의 집합, 쉽게 말해 “이미지를 만드는 설계도”라고 할 수 있다.

## Dockerfile이 왜 필요할까?

DockerHub에는 수많은 이미지가 올라와 있지만, 실제 서비스를 운영하기 위해선 내 애플리케이션 코드와 환경이 담긴 나만의 이미지가 필요하다.

Dockerfile을 작성하면 아래와 같은 과정을 자동화 할 수 있다

- 어떤 OS, 런타임 환경을 지정할지 정의
- 애플리케이션 코드를 이미지 안에 복사
- 필요한 라이브러리 및 패키지 설치
- 애플리케이션 실행 명령어 정의

Dockerfile이 있다면 누구든 동일한 명령어 한 줄로 완전히 동일한 이미지를 만들 수 있다.

```bash
docker build -t my-app .
```

## Docker 기본 문법

| 명령어    | 설명                                                                 |
| --------- | -------------------------------------------------------------------- |
| `FROM`    | 베이스 Image를 지정한다. 모든 Dockerfile은 반드시 FROM으로 시작한다. |
| `WORKDIR` | Container 안에서의 작업 디렉토리를 지정한다.                         |
| `COPY`    | 로컬 파일을 Container 안으로 복사한다.                               |
| `RUN`     | Image를 빌드하는 과정에서 실행할 명령어를 정의한다.                  |
| `EXPOSE`  | Container가 사용할 포트를 명시한다.                                  |
| `CMD`     | Container가 실행될 때 수행할 명령어를 정의한다.                      |

### 뭐임? `RUN`이랑 `CMD`랑 같잖아요 씨뱅아;;

![누구냐]({{ '/assets/images/posts/2026-06-27-Docker와 Container에 대해 알아보고 실제로 사용해보기/누구냐.png' | relative_url }})

ㄴㄴ 다름 나도 처음엔 그런줄 알았음ㅋㅋ

|           | RUN                    | CMD                |
| --------- | ---------------------- | ------------------ |
| 실행 시점 | 이미지 빌드 시         | 컨테이너 실행 시   |
| 주요 용도 | 패키지 설치, 환경 설정 | 애플리케이션 실행  |
| 횟수      | 여러 번 사용 가능      | 마지막 하나만 적용 |

예시를 보면서 이해해보자

```bash
# 예시
FROM node:18

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

흐름을 따라가보면 이렇다.

1. `FROM` — Node.js 18 버전을 베이스 Image로 사용
2. `WORKDIR` — 작업 디렉토리를 `/app` 으로 설정
3. `COPY` + `RUN` — 의존성 파일을 복사하고 설치
4. `COPY` — 나머지 소스코드 전체를 복사
5. `EXPOSE` — 3000번 포트 사용을 명시
6. `CMD` — Container 실행 시 `node server.js` 명령어 실행

**레이어 캐싱**

Dockerfile의 각 명령어는 실행될 때마다 **하나의 레이어(Layer)** 를 생성한다. Docker는 빌드 시 변경되지 않은 레이어는 **캐싱된 결과를 재사용**하기 때문에, 명령어 순서에 따라 빌드 속도가 크게 달라질 수 있다.

위 예시에서 `package.json` 을 먼저 복사하고 `npm install` 을 실행한 뒤, 나머지 소스코드를 복사한 이유가 바로 여기에 있다. 소스코드가 변경되더라도 `package.json` 이 바뀌지 않았다면 `npm install` 레이어는 캐시를 재사용하기 때문에 **빌드 속도가 훨씬 빨라진다.**

```bash
# ❌ 비효율적 - 소스코드가 바뀔 때마다 npm install이 다시 실행됨
COPY . .
RUN npm install

# ✅ 효율적 - package.json이 바뀌지 않으면 npm install 캐시 재사용
COPY package.json .
RUN npm install
COPY . .
```

---

## Docker로 여러 개의 Container를 실행하는 방법?

Dockerfile 하나로 단일 Container를 실행하는 것은 어렵지 않다. 하지만 실제 서비스는 보통 여러 개의 Container가 함께 동작한다.

예를 들면, 내가 실제로 배포한 웹 프로젝트 서비스라면 구성이 다음과 같다.

```
웹 서버 (nginx) + 백엔드 (Node.js) + 데이터베이스 (PostgreSQL)
```

세 가지를 각각 `docker run`으로 실행하려면 명령어가 너어무 길어지고 컨테이너 간 네트워크 설정도 직접 해줘야한다. 귀찮은게 이만저만이 아님;;

이런 **멀티 컨테이너 환경**을 한 번에 정의하고 관리할 수 있게 해주는 것이 바로 **“Docker Compose”**이다.

![image1]({{ '/assets/images/posts/2026-06-27-Docker와 Container에 대해 알아보고 실제로 사용해보기/image 1.png' | relative_url }})

### Docker Compose의 장점

- 여러 컨테이너를 명령어 한 줄로 실행하고 종료할 수 있다
- 컨테이너 간 네트워크 설정을 자동으로 해준다
- `docker-compose.yml`파일 하나로 전체 환경을 코드로 관리할 수 있다

![살려줘요]({{ '/assets/images/posts/2026-06-27-Docker와 Container에 대해 알아보고 실제로 사용해보기/살려줘요.png' | relative_url }})

### `docekr-compose.yml` 기본 구조

Docker Compose는 `docker-compose.yml`에 전체 환경을 정의한다.

```yaml
version: "3"

services:
  서비스명1:
    # 컨테이너 설정
  서비스명2:
    # 컨테이너 설정

volumes:
  # 볼륨 설정

networks:
  # 네트워크 설정
```

| 항목          | 설명                                      |
| ------------- | ----------------------------------------- |
| `version`     | Compose 파일의 버전을 정의한다            |
| `services`    | 실행할 Container들을 정의한다             |
| `image`       | 사용할 Image를 지정한다                   |
| `build`       | Dockerfile 경로를 지정하여 직접 빌드한다  |
| `ports`       | 포트 바인딩을 설정한다 (`-p` 옵션과 동일) |
| `volumes`     | 볼륨 마운트를 설정한다                    |
| `environment` | 환경 변수를 설정한다                      |
| `depends_on`  | Container 실행 순서를 정의한다            |

```yaml
# 예시
version: "3"

services:
  nginx:
    image: nginx
    ports:
      - "8080:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=database
      - DB_PORT=3306
    depends_on:
      - database

  database:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=mydb
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

흐름을 따라가보면 이렇다.

1. `database` Container가 먼저 실행된다
2. `database` 가 준비되면 `backend` Container가 실행된다
3. `backend` 가 준비되면 `nginx` Container가 실행된다
4. 세 Container는 자동으로 같은 네트워크에 묶여 서로 통신할 수 있다

### Docker Compose 핵심 명령어

| 명령어                              | 설명                                     |
| ----------------------------------- | ---------------------------------------- |
| `docker compose up`                 | 모든 Container를 실행한다                |
| `docker compose up -d`              | 백그라운드에서 실행한다                  |
| `docker compose down`               | 모든 Container를 중지하고 삭제한다       |
| `docker compose ps`                 | 실행 중인 Container 목록을 확인한다      |
| `docker compose logs`               | 전체 로그를 확인한다                     |
| `docker compose logs -f [서비스명]` | 특정 서비스의 로그를 실시간으로 확인한다 |

---

## 실제로 Docker를 써봐야겠지?

현재 만들고 있는 프로젝트에서 도커를 사용하고 있는데 이걸 설명하려고 가져왔수다

우선 IP카메라 시스템을 구축하고 그 카메라 시스템을 컨트롤 하는 컨트롤 서버를 구축했다.

그리고 다음과 같이 구성했다.

```
IP카메라 역할(camera-app)
 -> 영상 송출 시스템(mediamtx)
 -> IP카메라 관리 시스템(nvr-console)
 -> 컨트롤 서버(control-server)
```

각각 도커로 컨테이너화 시켜서 여러개의 컨테이너로 구성된 프로젝트이다.

이 중 `camera-app`의 컨테이너와 프로젝트의 `compose.yaml`파일의 내용을 예시로 설명해볼게용가리

`camera-app` 이미지를 만드는 설계도이고, `compose.yaml`의 `camera-app` 서비스는 그 이미지를 어떤 환경변수, 포트, 볼륨, 의존관계로 실행할지 정하는 런타임 설정입니다.

`/camera-app/Dockerfile`

```docker
FROM python:3.11-alpine # 베이스 이미지를 정함. 이 컨테이너는 Alpine Linux 위에 Python3.11이 들어있는 환경에서 시작
ENV PYTHONUNBUFFERED=1 # Python 로그를 버퍼링하지 않게 해서, 컨테이너 로그가 바로 보이도록 설정
RUN apk add --no-cache ffmpeg ttf-dejavu # 운영체제 패키지 설치, 그외는 프로젝트 관련ㅎㅎ ..
WORKDIR /app # 명령이 실행될 기본 작업 디렉터리 고정
COPY requirements.txt /app/requirements.txt             # Python 의존성을 이미지 안에 설치
RUN pip install --no-cache-dir -r /app/requirements.txt # Python 의존성을 이미지 안에 설치
COPY . /app # 소스코드를 이미지 안으로 복사
EXPOSE 8090 # 컨테이너가 8090 포트를 사용한다는 메타데이터, 이 줄만으로 호스트에서 접속 가능한건 아님
CMD ["python", "main.py"]
```

위 파일은 `Dockerfile`로 이미지를 만드는 설계도에 가까움

컨테이너는 이미지를 실제로 실행한 결과물임…!! 즉, 위 `Dockerfile`을 실행해줘야 컨테이너가 생긴다는것!!!

그렇다면 어떻게 실행할까?

위에서 설명한 **Docker Compose**가 실행해줌

`compose.yaml` - Docker Compose 관련 파일(`camera-app`에 관련된 부분)

```docker
camera-app:
  build: ./services/camera-app # 여기있는 Dockerfile을 읽어 이미지를 빌드하라는 뜻
  depends_on: # 위 이미지를 실행하기 전에 healthy가 되어야하는 컨테이너들
    mediamtx:
      condition: service_healthy
    control-server:
      condition: service_healthy
  ports: # 컨테이너의 포트를 정의하는 곳
    - "8090:8090" # 호스트의 8090포트를 컨테이너의 8090포트에 연결
  environment: # 컨테이너 안의 프로세스가 읽을 환경변수 삽입
    RUN_MODE: docker
    CAMERA_ID: camera-app-001
    SOURCE_TYPE: ${CAMERA_APP_SOURCE_TYPE:-file}
    RTSP_URL: rtsp://mediamtx:8554/cam1
    INPUT_SOURCE: /samples/demo.mp4
    API_HOST: 0.0.0.0
    API_PORT: 8090
    PRIMARY_CONTROL_URL: ${CAMERA_APP_PRIMARY_CONTROL_URL:-http://control-server:8080}
  volumes: # 컨테이너 내부에서 사용할 저장소를 정의하는 곳 (여기서는 카메라가 없을 때 대신 영상을 송출할 샘플 영상의 위치를 정의함)
    - ./samples:/samples:ro
  healthcheck: # 이미지를 실행하기 전에 healthy인지 아닌지 확인하기 위한 API를 호출하여 검사함
    test:
      - CMD
      - python
      - -c
      - "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8090/health')"

```

`camera-app` 컨테이너를 단순히 실행하는 것이 아니라, 전체 시스템 안에서 어떤 방식으로 붙일지를 정한다.

위 파일을 통해 `Dockerfile`을 실행시키고 컨테이너를 만드는 프로세스는 아래처럼 정리할 수 있다

**`docker compose up -d --build`를 치면 실제로 무슨 일이 일어나는가**

1. Compose가 `compose.yaml`을 읽습니다.
2. `camera-app` 서비스에 대해 `./services/camera-app`의 `Dockerfile`로 이미지를 빌드합니다.
3. `mediamtx`, `control-server`, `camera-app`, `nvr-console`이 붙을 공용 네트워크를 만듭니다.
4. `mediamtx`와 `control-server`를 먼저 띄우고 healthcheck를 확인합니다.
5. 준비가 되면 `camera-app` 컨테이너를 시작합니다.
6. 컨테이너 안에서 `python main.py`가 실행됩니다.
7. `main.py`는 환경변수를 읽어 설정을 만들고, RTSP 송출 스레드와 beacon/poller를 시작합니다.
8. 결과적으로 `camera-app`은 `mediamtx`로 영상을 보내고, `control-server`와 제어 트래픽을 주고받습니다.

---

![살려줘요_교수님]({{ '/assets/images/posts/2026-06-27-Docker와 Container에 대해 알아보고 실제로 사용해보기/살려줘요_교수님.jpg' | relative_url }})
갑자기 진도가 너무 빨라져서 무슨 말인지 모르겠죠?

괜찮습니다. 처음에는 AI와 대화하면서 간단한 웹 프로젝트를 만들고 그걸 배포하는 과정에서 2~3개의 컨테이너만 사용해보는 것을 목표로 설정하고 직접 구축해봅시다

이 글을 시작으로 한 번 도커 사용해봐요ㅎㅎ 마무리 하겠습니다 바이바이

![image2]({{ '/assets/images/posts/2026-06-27-Docker와 Container에 대해 알아보고 실제로 사용해보기/image 2.png' | relative_url }})
