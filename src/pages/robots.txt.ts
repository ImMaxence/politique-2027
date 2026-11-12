import type { APIRoute } from 'astro';
import { SITE } from '../config/site';

/** Crawlers used by AI assistants and answer engines: explicitly welcome. */
const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Amazonbot',
  'MistralAI-User', 'DuckAssistBot', 'meta-externalagent', 'Bytespider', 'cohere-ai',
];

export const GET: APIRoute = () => {
  const body = [
    '# Politique 2027 — everything here is public.',
    'User-agent: *',
    'Allow: /',
    '',
    '# AI assistants and answer engines are welcome. A summary of this site is at /llms.txt',
    ...AI_CRAWLERS.map((agent) => `User-agent: ${agent}`),
    'Allow: /',
    '',
    `Sitemap: ${SITE.url}/sitemap.xml`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
