import type { FileLanguage } from "./files";

export type TokenClass =
  | "kw" // declarations: const, function, true…
  | "ctl" // control / module keywords: import, export, return…
  | "str"
  | "num"
  | "cmt"
  | "tag"
  | "attr"
  | "punc"
  | "type"
  | "fn"
  | "sel"
  | "head"
  | "list"
  | "code";

export type Token = { text: string; cls?: TokenClass };

type Mode = "none" | "htmlComment" | "blockComment" | "template";
type State = { mode: Mode; inTag: boolean };

const KEYWORDS = new Set([
  "const", "let", "var", "function", "class", "new", "interface", "type",
  "extends", "implements", "typeof", "async", "await", "true", "false",
  "null", "undefined", "this", "void", "static", "readonly", "public",
  "private",
]);

const CONTROL = new Set([
  "import", "export", "default", "from", "return", "if", "else", "for",
  "while",
]);

const RE_DOCTYPE = /<!DOCTYPE[^>]*>/iy;
const RE_TAG_OPEN = /(<\/?)([A-Za-z][\w:.-]*)/y;
const RE_TAG_CLOSE = /\/?>/y;
const RE_STRING = /"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?/y;
const RE_ATTR = /(?:[@:#]|\[|\()?[A-Za-z_][\w.\-:]*(?:\]|\))?/y;
const RE_HEX = /#[0-9a-fA-F]{3,8}(?![\w-])/y;
const RE_NUMBER = /\d+(?:\.\d+)?(?:px|deg|rem|em|vh|vw|ms|s|%)?(?![A-Za-z_])/y;
const RE_DECORATOR = /@[A-Za-z_]\w*/y;
const RE_SELECTOR = /\.[A-Za-z_][\w-]*(?=\s*\{)/y;
const RE_PROPERTY = /--[\w-]+(?=\s*:)|[A-Za-z-]+(?=\s*:)/y;
const RE_IDENT = /[A-Za-z_$][\w$]*/y;
const RE_ARROW = /=>/y;

function matchAt(re: RegExp, line: string, pos: number) {
  re.lastIndex = pos;
  return re.exec(line);
}

function findTemplateEnd(line: string, from: number) {
  for (let i = from; i < line.length; i++) {
    if (line[i] === "\\") i++;
    else if (line[i] === "`") return i;
  }
  return -1;
}

function tokenizeCodeLine(
  line: string,
  state: State,
): { tokens: Token[]; state: State } {
  const tokens: Token[] = [];
  let { mode, inTag } = state;
  let pos = 0;

  const push = (text: string, cls?: TokenClass) => {
    if (!text) return;
    const last = tokens[tokens.length - 1];
    if (last && last.cls === cls) last.text += text;
    else tokens.push({ text, cls });
  };

  while (pos < line.length) {
    if (mode !== "none") {
      let end = -1;
      let closer = 1;
      if (mode === "htmlComment") {
        end = line.indexOf("-->", pos);
        closer = 3;
      } else if (mode === "blockComment") {
        end = line.indexOf("*/", pos);
        closer = 2;
      } else {
        end = findTemplateEnd(line, pos);
      }
      const cls: TokenClass = mode === "template" ? "str" : "cmt";
      if (end === -1) {
        push(line.slice(pos), cls);
        pos = line.length;
        break;
      }
      push(line.slice(pos, end + closer), cls);
      pos = end + closer;
      mode = "none";
      continue;
    }

    if (line.startsWith("<!--", pos)) {
      push("<!--", "cmt");
      pos += 4;
      mode = "htmlComment";
      continue;
    }
    if (line.startsWith("/*", pos)) {
      push("/*", "cmt");
      pos += 2;
      mode = "blockComment";
      continue;
    }
    if (line[pos] === "`") {
      push("`", "str");
      pos += 1;
      mode = "template";
      continue;
    }
    if (line.startsWith("//", pos) && line[pos - 1] !== ":") {
      push(line.slice(pos), "cmt");
      pos = line.length;
      break;
    }

    let m = matchAt(RE_STRING, line, pos);
    if (m) {
      push(m[0], "str");
      pos += m[0].length;
      continue;
    }

    if (inTag) {
      m = matchAt(RE_TAG_CLOSE, line, pos);
      if (m) {
        push(m[0], "punc");
        pos += m[0].length;
        inTag = false;
        continue;
      }
      m = matchAt(RE_ARROW, line, pos);
      if (m) {
        push(m[0]);
        pos += 2;
        continue;
      }
      m = matchAt(RE_ATTR, line, pos);
      if (m) {
        push(m[0], "attr");
        pos += m[0].length;
        continue;
      }
      m = matchAt(RE_NUMBER, line, pos);
      if (m) {
        push(m[0], "num");
        pos += m[0].length;
        continue;
      }
      push(line[pos]);
      pos += 1;
      continue;
    }

    m = matchAt(RE_DOCTYPE, line, pos);
    if (m) {
      push(m[0], "kw");
      pos += m[0].length;
      continue;
    }
    m = matchAt(RE_TAG_OPEN, line, pos);
    if (m) {
      push(m[1], "punc");
      push(m[2], "tag");
      pos += m[0].length;
      inTag = true;
      continue;
    }
    m = matchAt(RE_ARROW, line, pos);
    if (m) {
      push(m[0]);
      pos += 2;
      continue;
    }
    m = matchAt(RE_TAG_CLOSE, line, pos);
    if (m && m[0] === "/>") {
      push(m[0], "punc");
      pos += 2;
      continue;
    }
    m = matchAt(RE_HEX, line, pos);
    if (m) {
      push(m[0], "num");
      pos += m[0].length;
      continue;
    }
    m = matchAt(RE_SELECTOR, line, pos);
    if (m) {
      push(m[0], "sel");
      pos += m[0].length;
      continue;
    }
    m = matchAt(RE_DECORATOR, line, pos);
    if (m) {
      push(m[0], "fn");
      pos += m[0].length;
      continue;
    }
    m = matchAt(RE_PROPERTY, line, pos);
    if (m) {
      push(m[0], "attr");
      pos += m[0].length;
      continue;
    }
    m = matchAt(RE_IDENT, line, pos);
    if (m) {
      const word = m[0];
      const next = line[pos + word.length];
      let cls: TokenClass | undefined;
      if (KEYWORDS.has(word)) cls = "kw";
      else if (CONTROL.has(word)) cls = "ctl";
      else if (next === "(") cls = "fn";
      else if (/^[A-Z]/.test(word)) cls = "type";
      push(word, cls);
      pos += word.length;
      continue;
    }
    m = matchAt(RE_NUMBER, line, pos);
    if (m) {
      push(m[0], "num");
      pos += m[0].length;
      continue;
    }

    push(line[pos]);
    pos += 1;
  }

  return { tokens, state: { mode, inTag } };
}

function tokenizeInlineMarkdown(text: string): Token[] {
  const tokens: Token[] = [];
  const re = /`[^`]*`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ text: text.slice(last, m.index) });
    tokens.push({ text: m[0], cls: "code" });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last) });
  return tokens;
}

function tokenizeMarkdownLine(line: string): Token[] {
  if (/^#{1,6}\s/.test(line)) return [{ text: line, cls: "head" }];
  const list = /^(\s*)([-*]|\d+\.)(\s+)(.*)$/.exec(line);
  if (list) {
    return [
      { text: list[1] },
      { text: list[2], cls: "list" },
      { text: list[3] },
      ...tokenizeInlineMarkdown(list[4]),
    ];
  }
  return tokenizeInlineMarkdown(line);
}

/**
 * Splits source into per-line tokens. Multi-line constructs (HTML comments,
 * block comments, template literals, tags spanning several lines) carry state
 * from one line to the next.
 */
export function highlight(code: string, language: FileLanguage): Token[][] {
  const lines = code.split("\n");

  if (language === "markdown") return lines.map(tokenizeMarkdownLine);
  if (language === "glb") return lines.map((text) => [{ text }]);

  let state: State = { mode: "none", inTag: false };
  return lines.map((line) => {
    const result = tokenizeCodeLine(line, state);
    state = result.state;
    return result.tokens;
  });
}
