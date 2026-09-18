import type { ReactNode } from "react";

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;

  return text
    .split(tokenPattern)
    .filter(Boolean)
    .map((token, index) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return <strong key={index}>{token.slice(2, -2)}</strong>;
      }

      if (token.startsWith("`") && token.endsWith("`")) {
        return (
          <code key={index} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
            {token.slice(1, -1)}
          </code>
        );
      }

      if (token.startsWith("*") && token.endsWith("*")) {
        return <em key={index}>{token.slice(1, -1)}</em>;
      }

      return <span key={index}>{token}</span>;
    });
}

export function EarthAgentMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={`paragraph-${blocks.length}`}>
        {paragraph.map((line, index) => (
          <span key={index}>
            {index > 0 && <br />}
            {renderInlineMarkdown(line)}
          </span>
        ))}
      </p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const List = list.ordered ? "ol" : "ul";
    blocks.push(
      <List key={`list-${blocks.length}`} className="space-y-2 pl-5">
        {list.items.map((item, index) => (
          <li key={index} className="pl-1">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </List>,
    );
    list = null;
  };

  lines.forEach((line) => {
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    const unorderedItem = line.match(/^\s*[-*+]\s+(.+)$/);
    const orderedItem = line.match(/^\s*\d+[.)]\s+(.+)$/);

    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3
          key={`heading-${blocks.length}`}
          className="pt-2 text-sm font-bold text-foreground first:pt-0"
        >
          {renderInlineMarkdown(heading[1])}
        </h3>,
      );
      return;
    }

    if (line.trim() === "---" || line.trim() === "***") {
      flushParagraph();
      flushList();
      blocks.push(<hr key={`rule-${blocks.length}`} className="border-border/70" />);
      return;
    }

    if (unorderedItem || orderedItem) {
      flushParagraph();
      const ordered = Boolean(orderedItem);
      const item = (orderedItem ?? unorderedItem)![1];
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(item);
      return;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return <div className="space-y-3">{blocks}</div>;
}
