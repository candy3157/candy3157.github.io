---
layout: post
title: "서버와 웹 프로젝트 간 멤버 동기화 봇 만들기 : 비교 기반 Sync 채택"
date: 2026-02-24 00:03:00 +0900
categories:
  - dev
tags:
  - python
---

Discord 서버 멤버 목록을 DB로 옮기는 작업은 단순해 보이지만, 실제 내 프로젝트 기준에서는 꽤 까다로웠다.

신규/변경/탈퇴(누락)을 구분해야하고, 운영자가 수동으로 is_active=false 처리하는 기능도 있었기 때문에 그것도 고려해서 false 처리된 유저를 자동으로 되살리면 안되는 상황이었다.

이 글에서는 내가 만든 디스코드 봇이 이 **문제를 어떻게 해결하는지**, 디스코드 봇 프로젝트 **코드의 흐름 + 핵심 코드** 기준으로 설명한다.

---

### 1\. 프로젝트가 해결하는 문제

1.  Discord 서버의 멤버를 수집
2.  DB의 기존 멤버와 비교
3.  추가/수정/비활성화 를 나눠서 반영
4.  기존에 `is_active=false` 인 유저는 그대로 유지

문제를 해결했던 방법은 Discord 서버에서 가져온 멤버 리스트를 "전체 덮어쓰기"가 아닌 **"비교 기반" 동기화**였다.

---

### 2\. 전체 아키텍처

```
Discord API
  -> 멤버 수집
  -> 정규화(normalize)
  -> 기존 DB 조회
  -> diff 계산 (added/updated/missing)
  -> upsert + deactivate
  -> 결과 로그 출력
```

실제 코드 흐름제어는 main.py에서 담당한다.

---

### 3\. 실행 흐름 : `main.py`

`main.py` 의 `run_sync_once()`는 아래 순서로 동작한다.

1\. 설정 로드

    : `load_config()`로 `.env`를 읽는다.

```
config = load_config()
```

2\. Discord 연결

    : DiscordClient 로그인 후 준비될 때까지 대기한다.

```
client = DiscordClient(guild_id=config.guild_id)

await client.login(config.discord_token)
connect_task = asyncio.create_task(client.connect())
```

3\. 멤버 수집 및 정규화

    : `fetch_all_members()` → `normalize_member()` 로 표준 구조로 변환한다.

4\. 전송 분기

: `SYNC_TARGET`의 값이 `supabase`면 DB 동기화, `api`면 API 전송한다.

5\. 결과 요약 생성(통계 반환)

    : `added/updated/deactivated/...` 통계를 만들어서 성공로그에 남긴다.

```
raw_members = await client.fetch_all_members()
normalized = [normalize_member(m) for m in raw_members]	// 표준 구조 변환
sent_at = dt.datetime.now(tz=dt.timezone.utc).isoformat()

if config.sync_target == "supabase":	// 전송분기
    sync_stats = await sync_userlist(
        supabase_url=config.supabase_url,
        supabase_service_role_key=config.supabase_service_role_key,
        sent_at_iso=sent_at,
        members=normalized,
    )
    sync_summary = (	// 통계반환
        f"added={sync_stats.added}, updated={sync_stats.updated}, "
        f"deactivated={sync_stats.deactivated}, "
        f"preserved_inactive={sync_stats.preserved_inactive}, "
        f"unchanged={sync_stats.unchanged}"
    )
```

`run()`은 실행 시간 측정, 성공/실패 메시지, 종료 코드를 담당한다.

즉, 운영 관점의 안정성을 담당한다.

```
try:
    synced_count, sync_target, sync_summary = asyncio.run(run_sync_once())
except Exception as exc:
    print(f"[ERROR] Sync job failed ...: {exc}", flush=True)
    raise SystemExit(1) from exc

print(f"[SUCCESS] ... (target={sync_target}, members={synced_count}, {sync_summary}).")
```

---

### 4\. Discord 수집 로직 : `discord_client.py`

포인트는 두 가지이다.

1.  members intent 활성화  
    멤버 전체를 가져오려면 Discord Developer Portal에서 SERVER MEMBERS INTENT도 켜야 한다.
2.  길드 전체 멤버 순회  
    `guild.fetch_members(limit=None)`로 모든 멤버를 순회한다.

여기서 수집한 값은 아직 그대로 DB에 넣지 않습니다. 바로 다음 정규화 단계로 보낸다.

```
intents = discord.Intents.default()
intents.guilds = True
intents.members = True
```

```
async for member in guild.fetch_members(limit=None):
    members.append(
        RawMember(
            discord_id=str(member.id),
            username=str(user),
            global_name=user.global_name,
            nick=member.nick,
            avatar_url=str(user.avatar.url) if user.avatar else None,
            joined_at=joined_at,
        )
    )
```

---

### 5\. 정규화 로직 : `normalize.py`

Discord에는 닉네임, 글로벌 이름, username 등 이름 필드가 여러 개라서 그대로 저장하면 일관성이 깨진다.  
그래서 정규화 규칙을 고정했다.

- `display_name = nick or global_name or username`

이렇게 하면 DB에는 항상 같은 스키마로 들어간다.

```
def normalize_member(raw: RawMember) -> NormalizedMember:
    display_name = raw.nick or raw.global_name or raw.username
    return NormalizedMember(
        discord_id=raw.discord_id,
        display_name=display_name,
        username=raw.username,
        avatar_url=raw.avatar_url,
        discord_joined_at=raw.joined_at,
    )
```

---

### 6\. 핵심 : Supabase 비교 Sync : `supabase_client.py`

기존 DB 목록을 먼저 읽고, 새 목록과 `discord_id` 기준으로 비교한다.

6-1. 기존 데이터 조회

먼저 members 테이블을 페이지 단위로 조회해 `existing_map(key=discord_id)` 으로 구성한다.

```
select_fields = "discord_id,display_name,username,avatar_url,discord_joined_at,is_active"
members_url = f"{supabase_url}/rest/v1/members?select={select_fields}"
rows = await _get_json(session, members_url, page_headers)
```

6-2. 새 목록과 기존 데이터 비교

```
for member in members:
    existing_member = existing_map.get(member.discord_id)
    if existing_member is None:
        added += 1
        members_payload.append(_member_payload(member, sent_at_iso, is_active=True))
        continue
```

- 기존에 없으면 `added`
- 기존에 있으면 필드 비교 후 `updated` or `unchanged`

```
if _is_changed(existing_member, member, next_is_active):
    updated += 1
    members_payload.append(_member_payload(member, sent_at_iso, is_active=next_is_active))
else:
    unchanged += 1
```

6-3. `is_active=false` 유지 규칙

가장 중요한 로직이다.

```
next_is_active = existing_member.is_active
if not existing_member.is_active:
    preserved_inactive += 1
```

기존 값이 `false`면 새 목록에 나타나도 `false`를 유지한다.

즉, 새롭게 Sync를 진행해도 자동 재활성화가 되지 않는 것이다.

6-4. DB 반영 방식

추가/변경은 `POST /rest/v1/members?on_conflict=discord_id`로 upsert

```
members_url = f"{supabase_url}/rest/v1/members?on_conflict=discord_id"
await _post_json(session, members_url, headers, chunk)
```

누락된 기존 활성 유저는 `PATCH`로 `is_active=false`

```
patch_url = f"{supabase_url}/rest/v1/members?discord_id=in.({csv_ids})&is_active=eq.true"
payload = {"is_active": False, "updated_at": sent_at_iso}
await _patch_json(session, patch_url, headers, payload)
```

결과는 `SyncStats`로 반환되어 상위 레이어에서 로그로 출력됩니다.

---

### 7\. 이 로직의 장점

1.  데이터 정합성 : 전체 재삽입이 아닌, diff(비교) 기반이라 의도치 않은 덮어쓰기가 줄어듬
2.  운영 정책 반영 : `is_active=false` 보존으로 수동 관리 정책과 충돌하지 않음
3.  멤버 상태 자동 관리 용이성 : 새 목록에 없는 기존 활성 유저를 자동으로 `is_active=false` 처리하기 때문에 항상 최신 상태로 유지할 수 있음
4.  확장성 : 현재는 Supabase REST지만, 동일 패턴으로 RPC 다른 저장소로 이전하기 좋음

---

### 8\. 마무리

> 이 디스코드 봇 프로젝트 로직의 핵심 가치는 **“멤버 상태 동기화를 자동화”** 한다는 점이다.

Discord 서버 멤버 리스트와 웹 프로젝트의 멤버 DB가 **자동 Sync**되며, **운영자가 수동으로 명단을 맞출 필요가 거의 없어**진다.

동기화 시에는 기존 DB와 새 목록을 비교해, 기존에는 있었지만 새 목록에 없는 멤버를 **자동으로 `is_active=false`로 처리**한다.  
덕분에 **서버 이탈 멤버 상태가 즉시 반영**되어 활성 멤버 집합을 안정적으로 유지할 수 있다.

또한 이미 `is_active=false`인 멤버는, 새 목록에 다시 포함되더라도 **`is_active` 상태를 자동으로 바꾸지 않는다**.  
즉, 수동 비활성화 정책을 코드가 덮어쓰지 않도록 설계되어 운영 의도를 보존할 수 있습니다.

---

### Github Repository

[https://github.com/candy3157/Discord_User_Bot](https://github.com/candy3157/Discord_User_Bot "Discord_User_Bot")
