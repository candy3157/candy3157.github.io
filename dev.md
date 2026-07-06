---
layout: page
title: Dev
permalink: /dev.html
sitemap: false
---

{% assign posts = site.categories.dev %}
{% for post in posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) <span class="text-muted">{{ post.date | date: "%Y-%m-%d" }}</span>
{% endfor %}
