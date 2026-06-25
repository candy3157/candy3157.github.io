---
layout: default
title: Blog Management Methodology
permalink: /blog-management.html
---

# Blog Management Methodology

This document records how to operate `candy3157.github.io`, a GitHub Pages Jekyll blog using the `riggraz/no-style-please` remote theme.

## Verified Deployment

- Repository: `https://github.com/candy3157/candy3157.github.io`
- Production URL: `https://candy3157.github.io/`
- Publishing source: `main` branch, repository root
- Verified at: `2026-06-25 21:39 KST`
- Verification result:
  - GitHub Pages API status: `built`
  - Home page HTTP status: `200`
  - CSS asset HTTP status: `200`
  - Welcome post HTTP status: `200`

## Operating Principles

Keep the repository small and content-first. The `no-style-please` theme is intentionally minimal, so most changes should be Markdown content, `_config.yml` metadata, or `_data/menu.yml` navigation updates.

Use `main` as the publishing branch. For this user site repository, GitHub Pages serves the root of `main` directly at `https://candy3157.github.io/`, so `_config.yml` keeps `baseurl: ""`.

Prefer small commits. Separate content changes, navigation changes, and configuration changes when they are logically different. This makes Pages build failures easier to trace.

## Repository Structure

- `_config.yml`: site title, author, production URL, remote theme, plugin list, and `theme_config`
- `_data/menu.yml`: home page menu entries used by the theme's `home` layout
- `_posts/YYYY-MM-DD-slug.md`: dated blog posts
- `about.md`: static about page
- `archive.md`: archive page using the theme's `archive` layout
- `docs/blog-management-methodology.md`: this operating guide
- `Gemfile`: local preview dependencies for GitHub Pages-compatible Jekyll

## Writing Posts

Create posts under `_posts/` with this filename format:

```text
YYYY-MM-DD-title-slug.md
```

Use this front matter:

```yaml
---
layout: post
title: Post Title
date: 2026-06-25 21:30:00 +0900
categories: blog
---
```

Write the body in Markdown. Keep assets and links relative when they belong to this site. Because `permalink: /:slug.html` is configured, a post such as `_posts/2026-06-25-welcome.md` is published as `/welcome.html`.

## Managing Navigation

Edit `_data/menu.yml` to change the home page menu. The theme supports:

- Plain text entries with `title`
- Links with `title` and `url`
- Nested lists with `entries`
- Post lists with `post_list`

Use `post_list.limit` to keep the home page compact, and link to `archive.html` for the full list.

## Theme Configuration

The active theme is configured in `_config.yml`:

```yaml
remote_theme: riggraz/no-style-please
```

Important `theme_config` values:

- `appearance`: `auto`, `light`, or `dark`
- `back_home_text`: text for the post back link
- `date_format`: post date display format
- `show_description`: whether the home page shows the site description
- `lowercase_titles`: whether list titles are forced lowercase

For a GitHub Pages user site, keep:

```yaml
url: "https://candy3157.github.io"
baseurl: ""
```

## Publishing Workflow

1. Edit Markdown, `_data/menu.yml`, or `_config.yml`.
2. Check the working tree:

   ```sh
   git status --short --branch
   ```

3. Commit a focused change:

   ```sh
   git add <changed-files>
   git commit -m "Describe the blog change"
   ```

4. Push to GitHub:

   ```sh
   git push origin main
   ```

5. Verify Pages:

   ```sh
   gh api repos/candy3157/candy3157.github.io/pages --jq '{status: .status, html_url: .html_url, source: .source}'
   curl -L -I https://candy3157.github.io/
   ```

## Local Preview

If Ruby and Bundler are installed:

```sh
bundle install
bundle exec jekyll serve
```

Open `http://localhost:4000/`. This workspace did not have Ruby/Bundler installed when the initial site was created, so the authoritative verification was the live GitHub Pages deployment.

## Build Troubleshooting

If the public URL shows `404`, first check the Pages API status. A new push can take a short time to build and publish.

If the Pages status is failed, inspect the latest Pages build:

```sh
gh api repos/candy3157/candy3157.github.io/pages/builds/latest
```

Common fixes:

- Keep `baseurl: ""` for the `candy3157.github.io` user site.
- Keep `remote_theme: riggraz/no-style-please`.
- Keep `jekyll-remote-theme`, `jekyll-feed`, and `jekyll-seo-tag` in the plugin list.
- Ensure every post filename starts with a valid date.
- Ensure every post has `layout: post` in front matter.

## Maintenance Checklist

- Review `_config.yml` after changing site identity, URL, or theme behavior.
- Review `_data/menu.yml` after adding important pages.
- Add posts to `_posts/`; do not manually edit generated `_site/` output.
- Keep commits small and push to `main`.
- Confirm `https://candy3157.github.io/` returns HTTP `200` after meaningful changes.
