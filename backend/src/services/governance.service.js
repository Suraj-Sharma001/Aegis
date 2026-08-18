// ── Governance / PII Detection Layer ────────────────────────────────────
// Scans incoming prompts for sensitive data BEFORE they reach any AI
// provider. Default policy: BLOCK the request entirely if anything is
// found — safer than trying to "clean" and forward, since partial masking
// can still leak enough context, and silently modifying a user's prompt
// is its own kind of surprise.
//
// This is intentionally regex-based (not an ML model) for Phase 1 of this
// layer — it's fast, has zero external dependencies, and is easy to explain
// and defend in a viva ("here are the exact patterns, here's why each one
// matters"). A production system would likely add a proper NER model for
// names/addresses on top of this — worth naming as future work in your
// report if asked about limitations.

const PATTERNS = {
  EMAIL: {
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    label: 'Email address',
  },
  PHONE: {
    // Matches most international formats: +91 98765 43210, (555) 123-4567, etc.
    regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
    label: 'Phone number',
  },
  CREDIT_CARD: {
    // 13-19 digits, optionally separated by spaces or dashes in groups of 4
    regex: /\b(?:\d[ -]*?){13,19}\b/g,
    label: 'Credit card number',
  },
  AADHAAR: {
    // Indian Aadhaar: exactly 12 digits, often shown as XXXX XXXX XXXX
    regex: /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,
    label: 'Aadhaar-style ID number',
  },
  SSN: {
    // US SSN format: XXX-XX-XXXX
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    label: 'SSN-style ID number',
  },
  OPENAI_KEY: {
    regex: /\bsk-[a-zA-Z0-9]{20,}\b/g,
    label: 'OpenAI API key',
  },
  ANTHROPIC_KEY: {
    regex: /\bsk-ant-[a-zA-Z0-9-]{20,}\b/g,
    label: 'Anthropic API key',
  },
  AWS_KEY: {
    regex: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g,
    label: 'AWS access key',
  },
  GENERIC_SECRET: {
    // Catches "api_key: <long random string>", "token=<long random string>" etc.
    regex: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[a-zA-Z0-9_\-]{16,}['"]?/gi,
    label: 'Possible API key or secret',
  },
};

/**
 * Scans text for sensitive patterns.
 * @param {string} text
 * @returns {Array<{type: string, label: string, match: string}>}
 */
export function scanForPII(text) {
  if (!text) return [];

  const findings = [];

  for (const [type, { regex, label }] of Object.entries(PATTERNS)) {
    const matches = text.match(regex);
    if (matches) {
      for (const match of matches) {
        findings.push({ type, label, match });
      }
    }
  }

  return findings;
}

/**
 * Scans every message in a conversation array (checks user + system turns,
 * skips assistant turns since those weren't supplied by the caller).
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Array<{type: string, label: string, match: string}>}
 */
export function scanMessages(messages) {
  const findings = [];
  for (const msg of messages) {
    if (msg.role === 'assistant') continue;
    findings.push(...scanForPII(msg.content));
  }
  return findings;
}

// Masks matched sensitive substrings — used for logging findings without
// storing the actual sensitive value anywhere (e.g. in an audit log).
export function maskFindings(findings) {
  return findings.map((f) => ({
    type: f.type,
    label: f.label,
    preview: f.match.length > 4 ? `${f.match.slice(0, 2)}***${f.match.slice(-2)}` : '***',
  }));
}
