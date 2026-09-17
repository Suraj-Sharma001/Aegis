// Documentation content for the in-app /docs section. Content describes
// ONLY features that actually exist in the Aegis backend — endpoints and
// fields match the real implementation.

export const DOC_SECTIONS = [
  {
    section: 'Introduction',
    items: [
      { slug: 'getting-started', title: 'Getting Started' },
      { slug: 'authentication', title: 'Authentication' },
    ],
  },
  {
    section: 'Core Features',
    items: [
      { slug: 'making-requests', title: 'Making Requests' },
      { slug: 'semantic-caching', title: 'Semantic Caching' },
      { slug: 'governance', title: 'Governance & PII Firewall' },
      { slug: 'cost-tracking', title: 'Cost Tracking & Analytics' },
    ],
  },
  {
    section: 'Reference',
    items: [{ slug: 'api-reference', title: 'API Reference' }],
  },
];

export const ALL_DOC_SLUGS = DOC_SECTIONS.flatMap((s) => s.items.map((i) => i.slug));

// The right-side "on this page" table of contents is generated from these
// — kept as the single source of truth for heading text, which the H2
// component below slugifies into matching anchor ids.
export const DOC_HEADINGS = {
  'getting-started': ['What you need running', 'First steps'],
  authentication: ['Dashboard JWT', 'Gateway API key'],
  'making-requests': ['Endpoint', 'Request body', 'Response', 'Model → provider routing'],
  'semantic-caching': ['Hybrid matching', 'Response fields on a cache hit'],
  governance: ["What's detected", 'Blocked response'],
  'cost-tracking': ['Analytics endpoint', 'Notes on pricing'],
  'api-reference': ['Auth', 'Applications', 'Gateway', 'Health'],
};

export function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Shared building blocks ──
export function H2({ children }) {
  return (
    <h2 id={slugify(children)} className="font-display font-semibold text-lg text-ink mt-8 mb-3 first:mt-0 scroll-mt-24">
      {children}
    </h2>
  );
}
export function P({ children }) {
  return <p className="text-sm text-muted leading-relaxed mb-4">{children}</p>;
}
export function Code({ children }) {
  return (
    <pre className="bg-surface2 border border-border rounded-md p-4 text-xs font-mono text-ink overflow-x-auto mb-4 whitespace-pre-wrap">
      {children}
    </pre>
  );
}
export function InlineCode({ children }) {
  return <code className="bg-surface2 border border-border rounded px-1.5 py-0.5 text-xs font-mono text-accent">{children}</code>;
}
export function Ul({ children }) {
  return <ul className="list-disc list-outside ml-5 space-y-1.5 text-sm text-muted mb-4">{children}</ul>;
}
export function Note({ children }) {
  return <div className="bg-accent/5 border border-accent/25 rounded-md px-4 py-3 text-sm text-ink mb-4">{children}</div>;
}

// ── Page bodies ──
export function DocBody({ slug }) {
  switch (slug) {
    case 'getting-started':
      return (
        <>
          <P>
            Aegis is a unified gateway that sits between your applications and multiple AI providers —
            OpenAI, Google Gemini, Anthropic Claude, and local Ollama models — behind a single API.
          </P>
          <H2>What you need running</H2>
          <P>Three services run alongside each other during development:</P>
          <Ul>
            <li>PostgreSQL + Redis, via <InlineCode>docker compose up -d</InlineCode></li>
            <li>The embedding service (powers semantic caching), via <InlineCode>uvicorn app:app --port 8001</InlineCode></li>
            <li>The main backend, via <InlineCode>npm run dev</InlineCode> (defaults to port 8080)</li>
          </Ul>
          <H2>First steps</H2>
          <Ul>
            <li>Register an organization and admin user from the login page</li>
            <li>Create an Application from the Dashboard</li>
            <li>Issue a gateway API key for that application (see API Keys page)</li>
            <li>Send your first request — see <InlineCode>Making Requests</InlineCode></li>
          </Ul>
          <Note>
            The gateway key you issue is different from the JWT you get when logging in — see the
            Authentication page for how the two are used differently.
          </Note>
        </>
      );

    case 'authentication':
      return (
        <>
          <P>Aegis uses two entirely separate credentials for two different purposes.</P>
          <H2>Dashboard JWT</H2>
          <P>Returned when you log in or register. Used as a Bearer token for dashboard/admin routes.</P>
          <Code>{`Authorization: Bearer <jwt>`}</Code>
          <H2>Gateway API key</H2>
          <P>Issued per application, prefixed <InlineCode>aegis_</InlineCode>. Works across every provider — it is not tied to any specific model.</P>
          <Code>{`x-api-key: aegis_<your key>`}</Code>
          <Note>The raw key is shown only once, at creation. Only its hash is stored server-side.</Note>
        </>
      );

    case 'making-requests':
      return (
        <>
          <P>One endpoint handles every provider. The <InlineCode>model</InlineCode> field decides which provider receives the request.</P>
          <H2>Endpoint</H2>
          <Code>{`POST /v1/chat/completions
Header: x-api-key: aegis_<your key>
Header: Content-Type: application/json`}</Code>
          <H2>Request body</H2>
          <Code>{`{
  "model": "gemini-3.5-flash-lite",
  "messages": [
    { "role": "user", "content": "What is the capital of France?" }
  ]
}`}</Code>
          <H2>Response</H2>
          <Code>{`{
  "model": "gemini-3.5-flash-lite",
  "provider": "GEMINI",
  "content": "The capital of France is Paris.",
  "usage": { "prompt_tokens": 8, "completion_tokens": 7, "total_tokens": 15 },
  "latency_ms": 1408,
  "cache_hit": false,
  "cost_usd": 0.000031
}`}</Code>
          <H2>Model → provider routing</H2>
          <Ul>
            <li><InlineCode>gpt-*</InlineCode> / <InlineCode>o1-*</InlineCode> / <InlineCode>o3-*</InlineCode> → OpenAI</li>
            <li><InlineCode>claude-*</InlineCode> → Anthropic Claude</li>
            <li><InlineCode>gemini-*</InlineCode> → Google Gemini</li>
            <li>anything else → assumed to be a local Ollama model</li>
          </Ul>
        </>
      );

    case 'semantic-caching':
      return (
        <>
          <P>Before calling any provider, Aegis checks whether a similar-enough question has already been answered.</P>
          <H2>Hybrid matching</H2>
          <Ul>
            <li>Embedding similarity ≥ 0.90 → accepted immediately</li>
            <li>Embedding similarity ≥ 0.65 AND the two prompts share ≥50% of their core keywords → accepted</li>
            <li>Otherwise → treated as a new question</li>
          </Ul>
          <P>This combination was chosen after testing showed pure embedding similarity alone was unreliable on short, differently-worded questions.</P>
          <H2>Response fields on a cache hit</H2>
          <Code>{`{
  "cache_hit": true,
  "similarity_score": 0.9416,
  "cost_usd": 0,
  "cost_saved_usd": 0.00031
}`}</Code>
          <Note>Cached entries expire automatically after 24 hours.</Note>
        </>
      );

    case 'governance':
      return (
        <>
          <P>Every request is scanned for sensitive data BEFORE it reaches the cache or any provider. The default policy is to block.</P>
          <H2>What's detected</H2>
          <Ul>
            <li>Email addresses</li>
            <li>Phone numbers</li>
            <li>Credit card numbers</li>
            <li>Aadhaar-style 12-digit ID numbers</li>
            <li>SSN-style numbers (XXX-XX-XXXX)</li>
            <li>API keys — OpenAI (<InlineCode>sk-</InlineCode> and <InlineCode>sk-proj-</InlineCode>), Anthropic, AWS</li>
            <li>Generic secrets (<InlineCode>api_key: &lt;long string&gt;</InlineCode> patterns)</li>
          </Ul>
          <H2>Blocked response</H2>
          <Code>{`HTTP 422
{
  "error": "Request blocked by governance policy",
  "findings": [
    { "type": "EMAIL", "label": "Email address", "preview": "jo***om" }
  ]
}`}</Code>
          <Note>Only a masked preview of any match is ever logged — never the actual sensitive value.</Note>
        </>
      );

    case 'cost-tracking':
      return (
        <>
          <P>Every request is logged with its real cost in USD, from a per-model pricing table.</P>
          <H2>Analytics endpoint</H2>
          <Code>{`GET /applications/:id/analytics
Header: Authorization: Bearer <jwt>`}</Code>
          <Code>{`{
  "totalRequests": 17,
  "cacheHits": 5,
  "cacheHitRate": 29.4,
  "totalCostUsd": 0.00031,
  "estimatedSavingsUsd": 0.000041,
  "byProvider": { "GEMINI": { "requests": 17, "costUsd": 0.00031, "tokens": 478 } }
}`}</Code>
          <H2>Notes on pricing</H2>
          <Ul>
            <li>Ollama / local models are always priced at $0</li>
            <li>An unlisted model falls back to a conservative estimate rather than reporting $0</li>
            <li>Pricing is hand-maintained and should be checked periodically</li>
          </Ul>
        </>
      );

    case 'api-reference':
      return (
        <>
          <P>Every route currently implemented, grouped by area.</P>
          <H2>Auth</H2>
          <Ul>
            <li><InlineCode>POST /auth/register</InlineCode> — create organization + admin user</li>
            <li><InlineCode>POST /auth/login</InlineCode> — returns a JWT</li>
            <li><InlineCode>GET /auth/me</InlineCode> — current user (JWT required)</li>
          </Ul>
          <H2>Applications</H2>
          <Ul>
            <li><InlineCode>GET /applications</InlineCode> — list apps for your org (JWT)</li>
            <li><InlineCode>POST /applications</InlineCode> — create an application (JWT)</li>
            <li><InlineCode>POST /applications/:id/keys</InlineCode> — issue a new gateway key (JWT)</li>
            <li><InlineCode>GET /applications/:id/keys</InlineCode> — list issued keys, metadata only (JWT)</li>
            <li><InlineCode>GET /applications/:id/analytics</InlineCode> — usage + cost summary (JWT)</li>
            <li><InlineCode>GET /applications/:id/logs</InlineCode> — recent raw request log (JWT)</li>
          </Ul>
          <H2>Gateway</H2>
          <Ul>
            <li><InlineCode>POST /v1/chat/completions</InlineCode> — the unified completion endpoint (gateway API key)</li>
          </Ul>
          <H2>Health</H2>
          <Ul>
            <li><InlineCode>GET /health</InlineCode> — basic liveness check, no auth</li>
          </Ul>
        </>
      );

    default:
      return <P>Page not found.</P>;
  }
}
