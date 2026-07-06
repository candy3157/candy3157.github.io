---
layout: page
title: Archive
permalink: /archive.html
sitemap: false
---

{% for post in site.posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) <span class="text-muted">{{ post.date | date: "%Y-%m-%d" }}</span>
{% endfor %}
