---
layout: page
title: 블로그 관리 방법론
permalink: /blog-management.html
sitemap: false
---

# 블로그 관리 방법론

이 문서는 `jekyll-theme-chirpy` 테마를 사용하는 `candy3157.github.io` GitHub Pages Jekyll 블로그의 운영 기준을 정리한다.

## 배포 구조

- 저장소: `https://github.com/candy3157/candy3157.github.io`
- 공개 주소: `https://candy3157.github.io/`
- 배포 방식: GitHub Actions
- 배포 워크플로: `.github/workflows/pages-deploy.yml`
- 사이트 설정: `_config.yml`

Chirpy는 최신 Jekyll과 여러 플러그인을 사용하므로 GitHub Pages의 기본 Jekyll 빌드보다 Actions 빌드로 배포하는 편이 안정적이다. GitHub Pages 설정에서 Build and deployment Source를 `GitHub Actions`로 둔다.

## 저장소 구조

- `_config.yml`: 사이트 제목, URL, 언어, 테마, 플러그인, permalink 설정
- `_tabs/`: 사이드바 탭 페이지
- `_posts/YYYY-MM-DD-slug.md`: 날짜 기반 블로그 게시글
- `assets/images/posts/`: 게시글 이미지
- `assets/css/jekyll-theme-chirpy.scss`: Chirpy 스타일 진입점과 한국어 폰트 설정
- `about.md`: 기존 `/about.html` 주소 보존용 소개 페이지
- `docs/blog-management-methodology.md`: 현재 관리 방법론 문서
- `scripts/sync-notion-posts.mjs`: Notion 게시글 동기화 스크립트

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
categories:
  - dev
tags:
  - jekyll
---
```

Chirpy는 `categories` 배열과 `tags` 배열을 사용한다. 태그는 소문자로 작성한다. 카테고리와 태그 페이지는 `_tabs/categories.md`, `_tabs/tags.md`, `jekyll-archives` 설정을 통해 자동 생성된다.

## 이미지 관리

게시글 이미지는 `assets/images/posts/<post-key>/` 아래에 둔다. Markdown에서는 기존처럼 `relative_url` 필터를 사용할 수 있다.

```markdown
![설명]({{ '/assets/images/posts/example/image.png' | relative_url }})
```

Chirpy는 이미지 크기 지정도 지원한다.

```markdown
![설명]({{ '/assets/images/posts/example/image.png' | relative_url }}){: width="700" height="400" }
```

## 로컬 확인

Ruby와 Bundler가 설치되어 있다면 다음 명령으로 확인한다.

```sh
bundle install
bundle exec jekyll build
bundle exec jekyll serve
```

로컬 서버는 기본적으로 `http://127.0.0.1:4000`에서 열린다.

## Notion 동기화

Notion 동기화는 기존대로 `npm run sync:notion`을 사용한다. 동기화 스크립트는 Chirpy 권장 형식에 맞춰 태그를 소문자로 저장한다.
