import sanitizeHtml from "sanitize-html";

export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "code",
      "pre",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["style"],
    },
    allowedStyles: {
      span: {
        "text-decoration": [/^underline$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}
