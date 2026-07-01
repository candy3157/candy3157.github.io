---
layout: post
title: "Supabase Prisma 프로젝트에서 RLS 적용하는 방법: role 분리, 코드 import 분리"
date: 2026-02-24 00:03:00 +0900
categories:
  - dev
tags:
  - security
  - dev
  - DB
  - supabase
---

### RLS란 무엇인가?

\- **RLS**(Row Level Security)는 **데이터베이스의 테이블**에 **필터링 규칙**을 심어두는 보안 기술이다.

기존에는 코드에 일일이 `where is_active = true`라고 써야했지만, **RLS**를 설정하면 **DB가 알아서** 조건에 맞지 않는 데이터를 노출시키지 않는다.

### RLS는 왜 필요한가? + RLS 설정 시 좋은 점

DB 접속 권한이 있다 or 없다를 넘어서, Row 한 줄 한 줄마다 권한을 체크하기 때문에 보안의 차원이 달라진다.

- **왜 필요할까**
  - **권한 오용 차단** : **관리자용 계정**이 아닌 일반 **사용자용 계정**에서 **권한에 맞지 않는 DB**에 대한 접근/수정/삭제 등 **명령 자체가 거부**되므로, **해킹 시 피해가 최소화** 된다.
- **설정 시 좋은 점**
  - **데이터 격리** : 공개 데이터와 관리용 데이터가 **물리적으로 완벽히 분리**된다.
  - **보안 사고 예방** : API 엔드 포인트가 노출되어도, 계정의 DB 권한이 제한되어 있기 때문에 **접근이 불가능한 데이터를 건드릴 수 없다**.
  - **코드 단순화** : 복잡한 권한 체크 로직을 DB단에서 대신 처리하기 때문에 app **코드가 훨씬 간결**해진다.

### 프로젝트에 User 로그인 시스템이 없는데도 RLS가 필요한가?

\- **RLS는 DB가 있는 한 반드시 권장**된다. 웹 프로젝트 내에서 User 계정에 대한 로그인이 없을 뿐이지, 그 프로젝트를 방문하는 모든 방문자가 public(익명) 이 되고, 이 public으로 부터 데이터를 보호해야 하기 때문이다.

- 쓰기 권한 차단
  - 로그인이 없는 사이트라면 **일반 사용자는 '조회'만 가능**해야한다. 실수나 혹은 악의적으로 누군가 데이터를 수정하거나 삭제하는 요청을 보내도 **개발자가 의도한 권한에 맞지 않는 계정의 요청은 거부**되어야한다.

---

## Supabase RLS 적용하는 단계

(내가 활동하는 동아리 홈페이지 플젝 기준)

**1\. DB 역할(role) 2개로 분리**

- `app_admin` : 관리자 CRUD 전용
- `app_public` : 공개 페이지 전용

**2\. `.env`에서 admin용, public용 URL 분리**

**3\. Prisma 클라이언트 2개로 분리**

**4\. 코드 import를 역할별로 분리**

---

### 1\. DB 역할(role) 2개로 분리하기

공개 페이지에서 **정보를 조회하기 위한** public DB 계정과 관리자 페이지에서 정보를 **직접 CRUD 하기 위한** admin DB 계정을 만들어야한다.

```
-- 1) 역할 생성 (로그인 가능)
create role app_public with login password 'PUBLIC_STRONG_PASSWORD';
create role app_admin  with login password 'ADMIN_STRONG_PASSWORD';

-- 2) 기본 연결/스키마 권한
grant connect on database postgres to app_public, app_admin;
grant usage on schema public to app_public, app_admin;

-- 3) 혹시 모를 기존 권한 제거
revoke all on all tables in schema public from app_public, app_admin;
revoke all on all sequences in schema public from app_public, app_admin;

-- 4) 공개용 역할: 읽기만
grant select on table
  public.members,
  public.member_activity_fields,
  public.activities,
  public.activity_images
to app_public;

-- 5) 관리자 역할: 관리자 기능에 필요한 CRUD
grant select, insert, update, delete on table
  public.admins,
  public.admin_sessions,
  public.members,
  public.member_activity_fields,
  public.activities,
  public.activity_images
to app_admin;
```

\-- 계정 생성 확인용

```
select rolname, rolcanlogin, rolbypassrls
from pg_roles
where rolname in ('app_public', 'app_admin');
```

![계정생성확인용]({{ '/assets/images/posts/2026-02-24-Supabase Prisma 프로젝트에서 RLS 적용하는 방법: role 분리, 코드 import 분리/계정생성확인용.png' | relative_url }})

---

### 2\. `.env` 파일에 URL 환경변수 분리하기

현재 내 프로젝트의 Supabase Connect URL은 poller를 사용하기 때문에 사용자명에 Supabase 프로젝트의 ref를 붙여야한다.

ref → Supabase의 프로젝트를 식별하는 고유 문자열

```
DATABASE_URL="postgresql://postgres.ref:POSTGRES_STRONG_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
DATABASE_URL_PUBLIC="postgresql://app_public.ref:PUBLIC_STRONG_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
DATABASE_URL_ADMIN="postgresql://app_admin.ref:ADMIN_STRONG_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

기존에 있던 `DATABASE_URL`은 Prisma 마이그레이션이나 클라이언트 재구성할 때 필요하기 때문에 `.env` 파일에 남겨두어야한다.

---

### 3\. Prisma의 클라이언트 2개를 분리하기

.env에서 DB 계정에 대한 URL이 세팅이 완료되었다면, 이제 코드에서 **admin/public 클라이언트**를 **분리**해서 DB를 조회하게끔 바꾸어야한다.

즉, 원래 a 라는 클라이언트로 postgres라는 DB 계정을 사용해 DB 조회 + CRUD 를 사용했다면,

b 와 c 라는 두 개의 클라이언트로 나누어 각각 `app_admin`, `app_public` 이라는 DB 계정을 사용해서 **권한을 분리하는 것**이다.

```
기존
a(prisma client) -> postgres 계정 사용 -> DB 조회, CRUD -> 성공!

변경 후
b(prisma client) -> app_admin 계정 사용 -> DB 조회, CRUD -> 성공!
c(prisma client) -> app_public 계정 사용 -> DB 조회 -> 성공!
	       	 -> app_public 계정 사용 -> CRUD -> 실패..
```

---

### 4\. `import` 역할별로 분리

기존에는 모든 API를 postgres를 사용하여 조회, CRUD를 처리하고 있었지만, 클라이언트를 **관리자용**과 **사용자용**으로 **구분**하여 새로 만들었기 때문에 **코드도 클라이언트의 목적에 맞게 구분해서 수정**해주어야만 한다.

예를 들면, 사용자용 클라이언트는 조회만 하기 위해 만들었기 때문에 admin 관련 API에서는 사용될 필요가 없다. 그렇기 때문에 **admin 관련 API에서는 관리자용 클라이언트만 import** 해주었다.

admin 페이지 관련 API → postgres 에서 `app_admin` 으로 교체해주었다.

그외 일반적인 조회가 요구되는 부분(메인페이지의 members섹션, activities섹션 등)은 `app_public` 클라이언트로 교체해주었다.

---

### 5\. Prisma 마이그레이션 + 클라이언트 재생성

Prisma 클라이언트도 새로 만들고, DB에 관련된 사항도 변경되었기 때문에 **돌아가고있는 개발 서버가 있다면 중지**시키고 마이그레이션과 클라이언트를 재생성 해주어야 **위에서 적용한 모든 사항이 적용**된다.
