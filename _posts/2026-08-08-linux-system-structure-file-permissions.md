---
layout: post
title: 리눅스 시스템 구조와 파일 권한
date: 2026-08-08 00:00:00 +0900
categories:
  - dev
tags:
  - linux
  - os
notion_id: 3b64b276-66b0-81b6-8aa7-e1ee58414cdf
---

---

# 1. 서버 컴퓨터와 서버 역할은 다르다

서버 컴퓨터는 장시간 안정적으로 서비스를 제공하기 위해 냉각, 전원, 저장장치, 네트워크 등을 강화한 하드웨어를 의미한다. 하지만 서버의 본질은 하드웨어가 아니라 서비스를 제공하는 역할이다.

일반 PC, 노트북, NAS, Mini PC에도 Nginx·Apache·DBMS 같은 서버 프로그램을 설치하면 서버 역할을 수행할 수 있다.

운영체제는 CPU, 메모리, 디스크, 네트워크 같은 하드웨어 자원을 관리하고 여러 프로세스에 자원을 배분한다. 사용자 프로그램은 커널 내부 기능을 직접 호출하는 대신 open(), read(), write(), socket() 같은 시스템 콜 인터페이스를 통해 운영체제의 기능을 요청한다.

## 가상 메모리

프로세스는 물리 주소를 직접 사용하는 대신 가상 주소(VA) 를 사용한다. CPU의 MMU와 페이지 테이블이 가상 주소를 물리 주소(PA)로 변환한다.

가상 메모리의 주요 장점은 다음과 같다.

- 프로세스마다 독립된 주소 공간을 제공해 메모리를 격리할 수 있다.

- 실제로 사용하는 페이지를 필요할 때 매핑하는 지연 할당이 가능하다.

- 연속된 물리 메모리를 확보하지 않아도 연속된 가상 주소 공간처럼 사용할 수 있다.

- 필요에 따라 파일 매핑과 swap 같은 메커니즘을 활용할 수 있다.

> ABI는 가상 메모리의 장점이라기보다 CPU 아키텍처·OS·컴파일러 사이에서 호출 규약, 레지스터 사용, 바이너리 형식 등을 정하는 별도의 약속이다.

---

# 2. 리눅스 시스템 구조

리눅스를 큰 관점에서 보면 Core, I/O, 그리고 보안·관리 도구 영역으로 나눠 이해할 수 있다.

## 2.1 프로세스 관리

리눅스 커널은 실행 단위를 task_struct로 관리한다. 프로세스와 스레드는 커널 관점에서 모두 task로 표현되며, 같은 프로세스의 스레드들은 주소 공간 등 여러 자원을 공유할 수 있다.

CPU가 실행할 수 있는 runnable task는 CPU별 runqueue에서 관리되고, 스케줄러가 다음에 실행할 task를 선택한다.

핵심 개념은 다음과 같다.

- task_struct: 프로세스/스레드의 실행 상태와 각종 커널 정보를 담는 자료구조

- runqueue: CPU에서 실행 가능한 task들을 관리하는 실행 대기 구조

- 스케줄러: 실행 가능한 task 중 CPU를 사용할 대상을 결정

## 2.2 메모리 관리

리눅스는 물리 메모리를 페이지 단위로 관리한다. 일반적인 페이지 크기는 4 KiB(4096 bytes) 이며, 연속된 페이지 묶음을 효율적으로 할당·회수하기 위해 buddy allocator 같은 메커니즘을 사용한다.

프로세스별 가상 메모리는 mm_struct를 중심으로 관리한다. 그 안에는 여러 VMA(Virtual Memory Area)가 있으며 보통 다음과 같은 영역을 표현한다.

- 코드 영역

- 데이터 영역

- 힙

- mmap 영역

- 스택

VMA에는 가상 주소 범위, 접근 권한, 파일 매핑 여부 등의 정보가 저장된다.

### 지연 매핑과 page fault

malloc()이나 스택 확장 등으로 가상 주소 공간이 준비되었다고 해서 모든 페이지에 즉시 물리 메모리가 붙는 것은 아니다.

일반적인 흐름은 다음과 같다.

1. 프로세스가 특정 가상 주소에 접근한다.

1. MMU가 페이지 테이블을 확인한다.

1. 현재 매핑이 없다면 page fault 예외가 발생한다.

1. 커널이 해당 주소가 VMA에 포함된 유효한 주소인지 확인한다.

1. 유효하다면 필요한 페이지를 준비하고 페이지 테이블에 매핑한 뒤 명령을 다시 수행한다.

1. 유효하지 않은 주소라면 프로세스에 SIGSEGV가 전달되어 일반적으로 segmentation fault로 종료된다.

## 2.3 커널은 이벤트를 처리한다

커널은 하드웨어와 프로그램에서 발생하는 여러 이벤트를 처리한다.

### Interrupt

하드웨어에서 비동기적으로 발생한다. 예를 들어 NIC에 패킷이 도착하거나 장치에서 작업 완료 신호가 발생하는 경우다.

### Exception

현재 실행 중인 명령과 관련해 동기적으로 발생한다. 대표적인 예가 page fault다.

인터럽트 처리는 긴 작업을 한 번에 수행하기보다 긴급한 부분과 나중에 처리할 부분을 나눠 수행한다. 네트워크처럼 빈번한 이벤트에서는 hard IRQ, softirq/NAPI, workqueue 등의 메커니즘이 사용된다.

## 2.4 I/O: 네트워크와 파일시스템

### 네트워크

리눅스 네트워크 스택은 Ethernet/MAC, IP, TCP/UDP, socket 계층을 통해 통신을 처리한다. netfilter는 패킷 필터링·NAT 등의 훅을 제공하며 iptables, nftables 및 여러 컨테이너 네트워크 구성에서 활용된다.

### VFS와 파일시스템

VFS(Virtual File System)는 ext4, XFS 등 서로 다른 파일시스템을 공통된 open, read, write 인터페이스로 사용할 수 있게 한다.

또한 리눅스에서는 파일이 아닌 시스템 자원도 파일 형태의 인터페이스로 노출되는 경우가 많다.

- /proc: 프로세스와 커널 상태를 보여주는 procfs

- /sys: 장치와 커널 객체 정보를 보여주는 sysfs

- /run: 런타임 상태 파일을 저장하는 tmpfs가 일반적으로 마운트되는 위치

일반적인 파일시스템에는 다음과 같은 메타데이터 구조가 존재한다.

- superblock: 파일시스템 전체 정보

- inode: 파일의 권한, 소유자, 크기, 데이터 위치 등의 메타데이터

- data block: 실제 파일 데이터

---

# 3. 프로세스는 어떻게 실행되는가

쉘에서 실행 파일을 실행하면 개념적으로 다음 흐름을 거친다.

1. 디스크에 실행 파일이 존재한다.

1. Bash 같은 쉘이 명령을 해석한다.

1. 새 프로세스를 만들기 위해 fork() 계열 동작이 수행된다.

1. 자식 프로세스가 execve() 계열 시스템 콜로 실행 이미지를 교체한다.

1. 커널이 새 실행 파일에 맞는 주소 공간과 VMA를 구성한다.

1. 실행 가능한 task가 스케줄러의 실행 대상이 된다.

1. CPU에서 실행되며 필요한 메모리 페이지는 접근 시점에 매핑될 수 있다.

즉 프로세스를 이해할 때는 크게 task_struct → mm_struct/VMA → 페이지 테이블 → 스케줄링 → CPU 실행의 흐름을 연결해서 보면 좋다.

---

# 4. 리눅스 디렉터리 구조

주요 디렉터리의 역할을 알고 있으면 설정 파일이나 로그를 찾는 속도가 크게 빨라진다.

- /bin, /usr/bin: 일반 사용자가 사용하는 주요 실행 파일

- /sbin, /usr/sbin: 시스템 관리용 실행 파일

- /usr/local: 패키지 관리자와 별도로 관리자가 직접 설치한 프로그램이나 로컬 파일을 두는 용도

- /etc: 시스템 및 서비스 설정 파일

- /run: 부팅 이후 생성되는 PID 파일, socket 등 런타임 데이터

- /var/log: 로그

- /var/lib: 서비스의 지속적인 상태 데이터

- /var/cache: 다시 생성할 수 있는 캐시 데이터

- /lib, /usr/lib: 프로그램이 사용하는 공유 라이브러리

- /home: 일반 사용자 홈 디렉터리

실행 파일이 사용하는 공유 라이브러리는 ldd로 확인할 수 있다.

```shell
ldd /usr/bin/curl
```

정적 링크가 가능한 프로그램은 컴파일 시 -static 옵션을 사용할 수 있지만, 모든 라이브러리와 환경에서 항상 가능한 것은 아니다.

---

# 5. 쉘에서 자주 사용하는 명령

## 작업 제어

- Ctrl + Z: foreground 작업에 stop 시그널을 보내 일시 정지

- jobs: 현재 쉘의 job 목록 확인

- fg %번호: 정지된 job을 foreground로 복귀

## 리다이렉션

- >: 출력 결과로 파일을 덮어쓴다.

- >>: 기존 파일의 뒤에 내용을 추가한다.

- |: 앞 명령의 표준 출력을 다음 명령의 표준 입력으로 전달한다.

예시:

```shell
ps -ef | grep nginx
```

sudo는 명령 자체에만 적용되므로 쉘이 먼저 처리하는 >에는 권한이 전달되지 않는다.

```shell
# 실패할 수 있음
sudo echo "LANG=en_US.UTF-8" > /etc/locale.conf

# 권장 방식
echo "LANG=en_US.UTF-8" | sudo tee /etc/locale.conf

# 또는
sudo bash -c 'echo "LANG=en_US.UTF-8" > /etc/locale.conf'
```

## 파일 내용 필터링

```shell
grep -i "keyword" file.txt
grep -r "keyword" /etc
head -n 20 file.txt
tail -n 20 file.txt
wc -l file.txt
```

## 파일 찾기

```shell
find /var/log -type f -name "*.log"
locate nginx.conf
```

find는 실제 파일시스템을 탐색하므로 조건을 세밀하게 지정할 수 있다. locate는 미리 만들어 둔 데이터베이스를 검색해 빠르지만 최신 파일이 즉시 반영되지 않을 수 있다.

## 정렬과 필드 추출

```shell
ls -s | sort -nr
awk -F ':' '{print $1}' /etc/passwd
```

---

# 6. 리눅스 파일 권한

기본 권한은 소유자(user), 그룹(group), 기타 사용자(other) 세 범주에 각각 적용된다.

파일 접근 시 커널은 대략 다음 순서로 어떤 권한 세트를 적용할지 결정한다.

1. 현재 사용자가 파일 소유자인가?

1. 아니라면 파일의 그룹에 속해 있는가?

1. 둘 다 아니라면 other 권한을 적용한다.

확인에 유용한 명령:

```shell
whoami
groups
ls -l file
getfacl file
```

## r, w, x의 의미

일반 파일과 디렉터리에서 의미가 조금 다르다.

따라서 디렉터리에 x 권한이 없으면 해당 경로 아래 파일 이름을 알고 있어도 접근할 수 없다. 웹 서버 프로세스가 사용자 홈 아래의 파일에 접근하지 못하는 문제도 상위 디렉터리의 권한 때문에 발생할 수 있다.

권한 변경 예시:

```shell
chmod u+x script.sh
chmod 640 config.conf
chown nginx:nginx /var/www/example
```

> /proc, /sys의 일부 파일은 root라 해도 아무 값이나 쓸 수 있는 것이 아니다. 해당 커널 인터페이스가 쓰기를 지원하고, 커널의 추가 보안 정책과 조건까지 만족해야 한다.

---

# 7. 패키지 관리

패키지 관리자는 애플리케이션 스토어처럼 소프트웨어의 설치·업데이트·삭제와 의존성 관리를 담당한다.

- Debian/Ubuntu 계열: apt → 내부적으로 dpkg

- RHEL/Fedora 계열: dnf → 패키지 형식은 RPM

대표적인 저장소 설정 위치:

- Debian/Ubuntu: /etc/apt/sources.list, /etc/apt/sources.list.d/

- RHEL/Fedora: /etc/yum.repos.d/

패키지 설치 문제를 해결할 때는 다음 순서로 확인하면 좋다.

1. 외부 네트워크/DNS 연결 상태

1. repository 설정

1. 패키지 메타데이터 갱신

1. 패키지 검색과 의존성 확인

1. 설치 로그 확인

```shell
# Ubuntu/Debian
sudo apt update
sudo apt install nginx
sudo apt autoremove

# RHEL/Fedora
sudo dnf check-update
sudo dnf install nginx
sudo dnf autoremove
```

---

# 8. 웹 서버 운영과 포트 문제 해결

웹 서버를 운영할 때는 단순히 설치하는 것보다 설치 → 실행 → 포트 확인 → 요청 테스트 → 모니터링 → 장애 추적 흐름으로 보는 것이 중요하다.

포트와 프로세스 확인에는 최신 리눅스에서 ss를 우선 사용할 수 있다.

```shell
sudo ss -tulpn
sudo ss -tulpn | grep ':8080'
```

net-tools가 설치되어 있다면 다음과 같이 확인할 수도 있다.

```shell
sudo netstat -tulpn | grep 8080
```

## 포트 충돌 문제 해결

예를 들어 Node.js 애플리케이션이 3000번 포트를 사용할 수 없다면:

1. 3000번 포트를 점유한 프로세스를 확인한다.

1. 해당 PID가 어떤 프로세스인지 확인한다.

1. 불필요한 프로세스라면 정상 종료한다.

1. 애플리케이션을 다시 실행한다.

1. 실제로 포트가 listen 상태인지 다시 검증한다.

```shell
sudo ss -tulpn | grep ':3000'
ps -fp PID
kill PID
```

서비스 충돌이라면 프로세스를 무조건 kill하기보다 systemctl로 서비스를 관리하는 것이 좋다.

```shell
sudo systemctl stop httpd
sudo systemctl start nginx
sudo systemctl status nginx
```

## 간단한 부하·트래픽 테스트

- curl: HTTP 요청 테스트

- hping3: TCP 패킷 생성 및 네트워크 테스트

- bmon: 인터페이스별 대역폭 모니터링

- iptraf-ng: 네트워크 연결·트래픽 관찰

- ab: ApacheBench를 이용한 HTTP 부하 테스트

```shell
ab -n 10000 -c 1000 http://localhost/
hping3 --syn -p 80 localhost --fast
```

--flood 같은 높은 빈도의 트래픽 생성은 반드시 본인이 소유하거나 명시적으로 허가받은 테스트 환경에서만 수행해야 한다.

---

# 9. top으로 시스템 상태 읽기

top은 CPU, 메모리, task 상태를 한 화면에서 확인할 수 있는 기본 모니터링 도구다.

## Load Average

1분, 5분, 15분 동안의 시스템 부하를 나타낸다. Linux load average에는 실행 가능 상태(R) 뿐 아니라 uninterruptible sleep(D) 상태 task도 반영된다.

CPU-bound 환경이라면 코어가 2개인 시스템에서 load가 약 2라는 것은 두 코어가 지속적으로 바쁜 상태라는 감각으로 볼 수 있다. 다만 I/O 대기 중인 D 상태 task도 load를 올릴 수 있으므로 단순히 CPU 사용률 100%와 동일시하면 안 된다.

## Task 상태

- running: CPU에서 실행 중이거나 실행 가능한 상태

- sleeping: 이벤트를 기다리는 상태

- stopped: Ctrl + Z 등으로 정지된 상태

- zombie: 종료했지만 부모가 아직 종료 상태를 회수하지 않은 프로세스

### Zombie process

자식이 종료되면 부모는 wait() 계열 시스템 콜로 종료 상태를 회수해야 한다. 부모가 이를 수행하지 않으면 zombie가 남는다.

부모가 종료된 자식은 PID 1 또는 subreaper에게 재부모화될 수 있다. 컨테이너에서는 PID 1 역할의 프로세스가 자식 회수를 제대로 하지 않아 zombie가 누적되는 경우가 있다.

Docker에서는 다음과 같이 작은 init 프로세스를 넣어 자식 프로세스 회수를 맡길 수 있다.

```shell
docker run --init ...
```

--init은 systemd를 강제로 실행하는 옵션이 아니라 일반적으로 tini 계열의 작은 init 프로세스를 PID 1로 추가하는 방식이다.

## CPU 항목

- us: 일반 user-space 코드에 사용한 CPU 시간

- sy: kernel-space 코드에 사용한 CPU 시간

- ni: nice 값이 조정된 user-space task의 CPU 시간

- id: idle

- wa: I/O 완료를 기다리는 동안의 idle 시간

- hi: hardware interrupt 처리 시간

- si: software interrupt 처리 시간

네트워크 패킷이 폭증하는 상황에서는 si와 네트워크 관련 지표가 함께 증가하는지 살펴볼 수 있다.

## 메모리 항목

- total: 전체 메모리

- free: 완전히 사용되지 않는 메모리

- used: 사용 중인 메모리

- buff/cache: 파일 캐시 등 재활용 가능한 캐시

- available: 새 프로세스가 swap 없이 사용할 수 있을 것으로 추정되는 메모리

- swap: 메모리 압박 시 활용할 수 있는 디스크 기반 공간

Linux에서는 free가 작다는 이유만으로 메모리가 부족하다고 판단하면 안 된다. 파일 캐시는 필요할 때 회수할 수 있으므로 available을 함께 확인하는 것이 중요하다.

---

# 10. 페이지 캐시, Buffered I/O와 Direct I/O

물리 페이지는 프로세스의 anonymous memory뿐 아니라 파일 데이터를 캐싱하는 데도 사용된다.

- anonymous page: heap, stack 등 파일에 직접 연결되지 않은 메모리

- page cache: 파일 데이터를 메모리에 캐싱한 페이지

## Buffered I/O

일반적인 read()/write()는 페이지 캐시를 거친다.

### Write

1. 페이지 캐시에 데이터를 기록한다.

1. 해당 페이지가 dirty 상태가 된다.

1. 커널이 적절한 시점에 여러 dirty page를 저장장치로 write-back한다.

### Read

1. 페이지 캐시에서 데이터를 찾는다.

1. cache hit이면 메모리에서 바로 읽는다.

1. cache miss이면 저장장치 I/O를 요청한다.

1. I/O가 끝나면 페이지 캐시가 채워지고 대기하던 프로세스가 깨어난다.

커널은 순차 읽기를 감지하면 앞으로 읽을 데이터를 미리 가져오는 readahead를 수행할 수 있다.

## Direct I/O

Direct I/O는 일반적인 페이지 캐시 경로를 우회하려는 I/O 방식이다. 데이터베이스처럼 자체 캐시 정책을 관리하려는 프로그램에서 사용될 수 있지만 정렬(alignment) 등 제약이 있고 항상 더 빠른 것은 아니다.

malloc()은 일반적으로 사용자 공간 allocator가 heap을 관리하지만 큰 메모리 요청은 구현에 따라 내부적으로 mmap()을 사용할 수 있다.

---

# 11. 리눅스 네트워크 통신 흐름

## 송신

목적지에 데이터를 보내기 위해서는 IP와 전송 계층 포트 정보가 필요하다.

호스트는 라우팅 테이블과 subnet 정보를 기준으로 다음 hop을 결정한다.

- 같은 L2 네트워크라면 ARP로 목적지의 MAC 주소를 확인한다.

- 외부 네트워크라면 일반적으로 기본 게이트웨이의 MAC 주소를 ARP로 확인하고 프레임을 게이트웨이에 전달한다.

## TCP 3-way handshake

TCP 연결은 다음 순서로 형성된다.

1. Client → Server: SYN

1. Server → Client: SYN, ACK

1. Client → Server: ACK

연결 이후 수신 측은 ACK를 통해 어느 시퀀스까지 정상적으로 수신했는지 송신 측에 알린다.

## 서버에 패킷이 도착한 뒤

개념적인 수신 경로는 다음과 같다.

NIC → DMA/RX ring → interrupt/NAPI → 커널 네트워크 스택 → socket receive buffer → read/recv 시스템 콜 → user space

즉 패킷 하나를 이해할 때도 하드웨어 → 커널 → 프로세스 흐름으로 추적하면 문제 원인을 좁히기 쉽다.

---

# 12. 리눅스 문제 해결의 기본 원칙

리눅스 문제 해결 능력은 명령어를 많이 외우는 것보다 점검·확인·추적하는 과정에서 나온다.

문제가 생기면 다음 순서로 접근할 수 있다.

1. 현상을 재현하고 에러 메시지를 확보한다.

1. 사용자 공간, 커널, 하드웨어 중 어느 계층에서 문제가 발생하는지 나눈다.

1. 프로세스, 포트, 파일 권한, 로그, CPU, 메모리, 디스크, 네트워크를 부분적으로 점검한다.

1. 한 번에 여러 조건을 바꾸지 말고 하나씩 테스트한다.

1. 수정 후에는 반드시 동일한 명령이나 요청으로 정상 동작을 다시 검증한다.
