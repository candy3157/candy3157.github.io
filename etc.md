---
layout: page
title: Etc
permalink: /etc.html
sitemap: false
---

{% assign posts = site.categories.etc %}
{% for post in posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) <span class="text-muted">{{ post.date | date: "%Y-%m-%d" }}</span>
{% endfor %}
