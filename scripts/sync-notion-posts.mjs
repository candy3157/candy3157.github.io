import { Client } from "@notionhq/client";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

const { NOTION_TOKEN, NOTION_DATA_SOURCE_ID } = process.env;

if (!NOTION_TOKEN || !NOTION_DATA_SOURCE_ID) {
  throw new Error("NOTION_TOKEN and NOTION_DATA_SOURCE_ID are required.");
}

const notion = new Client({ auth: NOTION_TOKEN });
const dataSourceId = NOTION_DATA_SOURCE_ID;
const postImageRoot = path.join("assets", "images", "posts");

const text = (rich = []) => rich.map((r) => r.plain_text).join("");

const propText = (props, name) =>
  text(props[name]?.rich_text || props[name]?.title || []);

const propMulti = (props, name) =>
  props[name]?.multi_select?.map((v) => v.name) || [];

const propOption = (props, name) =>
  props[name]?.status?.name || props[name]?.select?.name || "";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w가-힣-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

async function getPublishedPages() {
  const pages = [];
  let cursor;

  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      sorts: [{ property: "Published Date", direction: "descending" }],
    });

    pages.push(
      ...res.results.filter(
        (page) => propOption(page.properties, "Status") === "Published",
      ),
    );
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  return pages;
}

async function getBlocks(blockId) {
  const blocks = [];
  let cursor;

  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

function getPageMetadata(page) {
  const props = page.properties;
  const title = propText(props, "Title");
  const dateRaw = props["Published Date"]?.date?.start;
  const date = (dateRaw || page.created_time).slice(0, 10);
  const slug = propText(props, "Slug") || slugify(title);
  const categories = propMulti(props, "Categories");
  const tags = propMulti(props, "Tags").map((tag) => tag.toLowerCase());
  const postKey = `${date}-${slug}`;
  const filePath = path.join("_posts", `${date}-${slug}.md`);
  const imageDir = path.join(postImageRoot, postKey);
  const imageUrlPrefix = `/assets/images/posts/${postKey}`;

  return { title, date, categories, tags, filePath, imageDir, imageUrlPrefix };
}

function imageUrlFromBlock(data) {
  if (data.type === "external") return data.external.url;
  if (data.type === "file") return data.file.url;

  return "";
}

function imageExtensionFromContentType(contentType) {
  const type = contentType.split(";")[0].trim().toLowerCase();

  if (type === "image/jpeg") return ".jpg";
  if (type === "image/png") return ".png";
  if (type === "image/gif") return ".gif";
  if (type === "image/webp") return ".webp";
  if (type === "image/svg+xml") return ".svg";

  return "";
}

function imageExtensionFromUrl(url) {
  try {
    const extension = path.extname(new URL(url).pathname).toLowerCase();
    const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);

    return supportedExtensions.has(extension) ? extension : "";
  } catch {
    return "";
  }
}

function markdownAltText(value) {
  return value.replace(/[\[\]\n]/g, " ").trim() || "image";
}

async function downloadImage(url, metadata, imageState) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${url}`);
  }

  imageState.count += 1;

  const contentType = response.headers.get("content-type") || "";
  const extension =
    imageExtensionFromContentType(contentType) || imageExtensionFromUrl(url) || ".png";
  const filename = `image-${String(imageState.count).padStart(3, "0")}${extension}`;
  const filePath = path.join(metadata.imageDir, filename);
  const fileBuffer = Buffer.from(await response.arrayBuffer());

  await fs.mkdir(metadata.imageDir, { recursive: true });
  await fs.writeFile(filePath, fileBuffer);

  return `${metadata.imageUrlPrefix}/${filename}`;
}

async function blockToMarkdown(block, metadata, imageState) {
  const type = block.type;
  const data = block[type];

  if (type === "paragraph") return text(data.rich_text);
  if (type === "heading_1") return `# ${text(data.rich_text)}`;
  if (type === "heading_2") return `## ${text(data.rich_text)}`;
  if (type === "heading_3") return `### ${text(data.rich_text)}`;
  if (type === "bulleted_list_item") return `- ${text(data.rich_text)}`;
  if (type === "numbered_list_item") return `1. ${text(data.rich_text)}`;
  if (type === "quote") return `> ${text(data.rich_text)}`;
  if (type === "code")
    return `\`\`\`${data.language || ""}\n${text(data.rich_text)}\n\`\`\``;
  if (type === "divider") return "---";

  if (type === "image") {
    const url = imageUrlFromBlock(data);
    if (!url) return "";

    const localUrl = await downloadImage(url, metadata, imageState);
    const altText = markdownAltText(text(data.caption || []));

    return `![${altText}]({{ '${localUrl}' | relative_url }})`;
  }

  return "";
}

async function syncPage(page, metadata) {
  const blocks = await getBlocks(page.id);
  const imageState = { count: 0 };
  const markdownBlocks = [];

  await fs.rm(metadata.imageDir, { recursive: true, force: true });

  for (const block of blocks) {
    const markdown = await blockToMarkdown(block, metadata, imageState);
    if (markdown) markdownBlocks.push(markdown);
  }

  const body = markdownBlocks.join("\n\n");

  const frontMatter = yaml.dump({
    layout: "post",
    title: metadata.title,
    date: `${metadata.date} 00:00:00 +0900`,
    categories: metadata.categories,
    tags: metadata.tags,
    notion_id: page.id,
  });

  const content = `---\n${frontMatter}---\n\n${body}\n`;

  await fs.mkdir("_posts", { recursive: true });
  await fs.writeFile(metadata.filePath, content, "utf8");
}

function frontMatterFromMarkdown(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  return yaml.load(match[1]) || {};
}

async function cleanupRemovedPosts(expectedPostPaths) {
  let deleted = 0;
  const entries = await fs.readdir("_posts", { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

    const filePath = path.join("_posts", entry.name);
    const content = await fs.readFile(filePath, "utf8");
    const frontMatter = frontMatterFromMarkdown(content);
    const notionId = frontMatter.notion_id;

    if (!notionId) continue;

    const expectedPath = expectedPostPaths.get(notionId);
    if (!expectedPath || path.normalize(filePath) !== path.normalize(expectedPath)) {
      const imageDir = path.join(postImageRoot, path.basename(filePath, ".md"));

      await fs.unlink(filePath);
      await fs.rm(imageDir, { recursive: true, force: true });
      deleted += 1;
    }
  }

  return deleted;
}

const pages = await getPublishedPages();
const expectedPostPaths = new Map();

for (const page of pages) {
  const metadata = getPageMetadata(page);
  expectedPostPaths.set(page.id, metadata.filePath);
  await syncPage(page, metadata);
}

const deleted = await cleanupRemovedPosts(expectedPostPaths);

console.log(`Synced ${pages.length} Notion posts. Deleted ${deleted} stale posts.`);
