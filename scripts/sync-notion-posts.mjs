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

function blockToMarkdown(block) {
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
    const url = data.type === "external" ? data.external.url : data.file.url;
    return `![image](${url})`;
  }

  return "";
}

async function syncPage(page) {
  const props = page.properties;
  const title = propText(props, "Title");
  const dateRaw = props["Published Date"]?.date?.start;
  const date = (dateRaw || page.created_time).slice(0, 10);
  const slug = propText(props, "Slug") || slugify(title);
  const categories = propMulti(props, "Categories");
  const tags = propMulti(props, "Tags");

  const blocks = await getBlocks(page.id);
  const body = blocks.map(blockToMarkdown).filter(Boolean).join("\n\n");

  const frontMatter = yaml.dump({
    layout: "post",
    title,
    date: `${date} 00:00:00 +0900`,
    categories,
    tags,
    notion_id: page.id,
  });

  const filePath = path.join("_posts", `${date}-${slug}.md`);
  const content = `---\n${frontMatter}---\n\n${body}\n`;

  await fs.mkdir("_posts", { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

const pages = await getPublishedPages();

for (const page of pages) {
  await syncPage(page);
}

console.log(`Synced ${pages.length} Notion posts.`);
