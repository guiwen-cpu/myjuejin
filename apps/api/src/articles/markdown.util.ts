import MarkdownIt from 'markdown-it'
import xss from 'xss'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,
})

const whiteList = {
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  p: [],
  br: [],
  hr: [],
  strong: [],
  em: [],
  b: [],
  i: [],
  del: [],
  s: [],
  ul: [],
  ol: [],
  li: [],
  a: ['href', 'title', 'target', 'rel'],
  code: ['class'],
  pre: [],
  blockquote: [],
  img: ['src', 'alt', 'title', 'loading'],
  table: [],
  thead: [],
  tbody: [],
  tr: [],
  th: ['align'],
  td: ['align'],
  input: ['disabled', 'type', 'checked'],
  span: ['class'],
}

export function renderMarkdown(contentMd: string): string {
  const raw = md.render(contentMd)
  return xss(raw, {
    whiteList,
    stripIgnoreTag: true,
    allowCommentTag: false,
  })
}
