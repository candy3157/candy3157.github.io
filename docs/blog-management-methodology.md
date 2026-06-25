---
layout: default
title: 블로그 관리 방법론
permalink: /blog-management.html
---

# 블로그 관리 방법론

이 문서는 `riggraz/no-style-please` 원격 테마를 사용하는 `candy3157.github.io` GitHub Pages Jekyll 블로그의 운영 기준을 정리한다.

## 배포 확인 결과

- 저장소: `https://github.com/candy3157/candy3157.github.io`
- 공개 주소: `https://candy3157.github.io/`
- Pages 소스: `main` 브랜치의 저장소 루트
- 확인 일시: `2026-06-25 21:39 KST`
- 확인 결과:
  - GitHub Pages API 상태: `built`
  - 홈 페이지 HTTP 상태: `200`
  - CSS 자산 HTTP 상태: `200`
  - 첫 게시글 HTTP 상태: `200`

## 운영 원칙

이 블로그는 글 중심으로 운영한다. `no-style-please` 테마는 장식보다 읽기 흐름을 우선하는 미니멀 테마이므로, 대부분의 변경은 Markdown 글, `_config.yml` 설정, `_data/menu.yml` 메뉴 수정으로 끝내는 것이 좋다.

`main` 브랜치를 배포 브랜치로 사용한다. 이 저장소는 사용자 사이트 저장소인 `candy3157.github.io`이므로 GitHub Pages가 `main` 브랜치 루트를 `https://candy3157.github.io/`에 직접 배포한다. 따라서 `_config.yml`의 `baseurl`은 빈 문자열로 유지한다.

커밋은 작게 나눈다. 글 작성, 메뉴 변경, 설정 변경은 가능하면 별도 커밋으로 분리한다. 이렇게 하면 Pages 빌드 실패가 발생했을 때 원인을 추적하기 쉽다.

## 저장소 구조

- `_config.yml`: 사이트 제목, 작성자, 공개 URL, 원격 테마, 플러그인, 테마 옵션
- `_data/menu.yml`: 홈 화면 메뉴 구조
- `_posts/YYYY-MM-DD-slug.md`: 날짜 기반 블로그 게시글
- `about.md`: 소개 페이지
- `archive.md`: 전체 글 목록 페이지
- `docs/blog-management-methodology.md`: 현재 관리 방법론 문서
- `Gemfile`: 로컬 미리보기용 GitHub Pages 호환 Jekyll 의존성

## 글 작성 방법

새 글은 `_posts/` 아래에 만든다. 파일명은 다음 형식을 따른다.

```text
YYYY-MM-DD-title-slug.md
```

기본 front matter는 다음처럼 작성한다.

```yaml
---
layout: post
title: 글 제목
date: 2026-06-25 21:30:00 +0900
categories: blog
---
```

본문은 Markdown으로 작성한다. 이 사이트에 포함되는 이미지나 문서는 가능한 한 상대 경로를 사용한다. 현재 `_config.yml`에 `permalink: /:slug.html`이 설정되어 있으므로 `_posts/2026-06-25-welcome.md`는 `/welcome.html`로 배포된다.

## 메뉴 관리 방법

홈 화면 메뉴는 `_data/menu.yml`에서 관리한다. `no-style-please` 테마는 이 파일의 `entries` 값을 읽어 홈 메뉴를 만든다.

주요 패턴은 다음과 같다.

- 단순 텍스트: `title`
- 링크: `title`과 `url`
- 중첩 목록: `entries`
- 글 목록: `post_list`

홈 화면이 길어지지 않도록 `post_list.limit`으로 최근 글 개수를 제한하고, 전체 글은 `archive.html`로 연결한다.

## 테마 설정 방법

현재 테마는 `_config.yml`에서 다음처럼 설정한다.

```yaml
remote_theme: riggraz/no-style-please
```

자주 조정하는 `theme_config` 항목은 다음과 같다.

- `appearance`: `auto`, `light`, `dark` 중 선택
- `back_home_text`: 글 페이지의 홈으로 돌아가기 링크 문구
- `date_format`: 글 날짜 표시 형식
- `show_description`: 홈 화면에 사이트 설명을 표시할지 여부
- `lowercase_titles`: 목록 제목을 소문자로 강제할지 여부

사용자 사이트 저장소에서는 URL 설정을 다음처럼 유지한다.

```yaml
url: "https://candy3157.github.io"
baseurl: ""
```

## 배포 절차

1. Markdown 글, `_data/menu.yml`, `_config.yml` 중 필요한 파일을 수정한다.
2. 작업 상태를 확인한다.

   ```sh
   git status --short --branch
   ```

3. 관련 파일만 스테이징하고 커밋한다.

   ```sh
   git add <changed-files>
   git commit -m "변경 내용을 짧게 설명"
   ```

4. `main` 브랜치에 푸시한다.

   ```sh
   git push origin main
   ```

5. Pages 상태와 공개 URL을 확인한다.

   ```sh
   gh api repos/candy3157/candy3157.github.io/pages --jq '{status: .status, html_url: .html_url, source: .source}'
   curl -L -I https://candy3157.github.io/
   ```

## 로컬 미리보기

Ruby와 Bundler가 설치되어 있다면 다음 명령으로 로컬 미리보기를 실행한다.

```sh
bundle install
bundle exec jekyll serve
```

브라우저에서 `http://localhost:4000/`을 연다. 초기 생성 시점의 이 작업 환경에는 Ruby/Bundler가 없었으므로, 최종 검증은 실제 GitHub Pages 배포 결과를 기준으로 했다.

## 빌드 문제 해결

공개 URL이 `404`를 반환하면 먼저 Pages API 상태를 확인한다. 새 커밋을 푸시한 직후에는 빌드와 배포에 시간이 걸릴 수 있다.

빌드 상태가 실패라면 최신 Pages 빌드를 확인한다.

```sh
gh api repos/candy3157/candy3157.github.io/pages/builds/latest
```

자주 확인할 항목은 다음과 같다.

- `candy3157.github.io` 사용자 사이트에서는 `baseurl: ""`를 유지한다.
- `remote_theme: riggraz/no-style-please`를 유지한다.
- 플러그인 목록에 `jekyll-remote-theme`, `jekyll-feed`, `jekyll-seo-tag`를 유지한다.
- 게시글 파일명은 유효한 날짜로 시작해야 한다.
- 게시글 front matter에는 `layout: post`를 둔다.

## 유지보수 체크리스트

- 사이트 이름, URL, 테마 옵션을 바꿀 때는 `_config.yml`을 검토한다.
- 주요 페이지를 추가하면 `_data/menu.yml`에 연결할지 결정한다.
- 글은 `_posts/`에 추가하고, 생성물인 `_site/`는 직접 수정하지 않는다.
- 변경은 작은 단위로 커밋하고 `main`에 푸시한다.
- 중요한 변경 후에는 `https://candy3157.github.io/`가 HTTP `200`을 반환하는지 확인한다.
