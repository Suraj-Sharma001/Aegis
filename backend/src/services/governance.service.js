// ── Production-Grade Governance / PII Detection Layer ────────────────────
// Scans incoming prompts for sensitive data BEFORE they reach any AI
// provider. Configurable per-organization with allowlist support.
//
// Pattern-based detection (fast, zero dependencies, auditable) with
// improved accuracy via Luhn validation for credit cards and better
// regex patterns to reduce false positives.

const PATTERNS = {
  EMAIL: {
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    label: 'Email address',
    severity: 'HIGH',
  },
  PHONE: {
    // International formats: +1 555-123-4567, (555) 123-4567, +44 20 1234 5678
    // Requires at least 10 digits to avoid false positives on short numbers
    regex: /(?:\+?(\d{1,3}))?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g,
    label: 'Phone number',
    severity: 'MEDIUM',
  },
  CREDIT_CARD: {
    // 13-19 digits with optional spaces/dashes, validated with Luhn algorithm
    regex: /\b(?:\d[-\s]?){12,18}\d\b/g,
    label: 'Credit card number',
    severity: 'CRITICAL',
    validate: luhnCheck,
  },
  SSN: {
    // US SSN format: XXX-XX-XXXX (strict format only to avoid false positives)
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    label: 'Social Security Number',
    severity: 'CRITICAL',
  },
  AADHAAR: {
    // Indian Aadhaar: exactly 12 digits, often shown as XXXX XXXX XXXX
    regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    label: 'Aadhaar number',
    severity: 'HIGH',
  },
  OPENAI_KEY: {
    // Covers sk-<chars> and sk-proj-<chars> formats
    regex: /\bsk-(proj-)?[a-zA-Z0-9_-]{20,}\b/g,
    label: 'OpenAI API key',
    severity: 'CRITICAL',
  },
  ANTHROPIC_KEY: {
    regex: /\bsk-ant-[a-zA-Z0-9_-]{20,}\b/g,
    label: 'Anthropic API key',
    severity: 'CRITICAL',
  },
  AWS_KEY: {
    regex: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g,
    label: 'AWS access key',
    severity: 'CRITICAL',
  },
  GOOGLE_API_KEY: {
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    label: 'Google API key',
    severity: 'CRITICAL',
  },
  GITHUB_TOKEN: {
    regex: /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/g,
    label: 'GitHub token',
    severity: 'CRITICAL',
  },
  GENERIC_SECRET: {
    // Catches "api_key: <long string>", "token=<long string>" patterns
    regex: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[a-zA-Z0-9_\-]{16,}['"]?/gi,
    label: 'Possible API key or secret',
    severity: 'HIGH',
  },
  IP_ADDRESS: {
    // IPv4 addresses (basic check, not full validation)
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    label: 'IP address',
    severity: 'LOW',
    validate: (match) => {
      const parts = match.split('.');
      return parts.length === 4 && parts.every(p => parseInt(p) <= 255);
    },
  },
};

/**
 * Luhn algorithm for credit card validation (reduces false positives)
 * @param {string} cardNumber
 * @returns {boolean}
 */
function luhnCheck(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Scans text for sensitive patterns with validation
 * @param {string} text
 * @param {Object} config - Optional config with enabled patterns and allowlist
 * @returns {Array<{type: string, label: string, match: string, severity: string}>}
 */
export function scanForPII(text, config = {}) {
  if (!text) return [];

  const {
    enabledPatterns = Object.keys(PATTERNS),
    allowlist = [],
    minSeverity = 'LOW',
  } = config;

  const findings = [];
  const severityOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
  const minSeverityLevel = severityOrder[minSeverity] || 0;

  for (const [type, { regex, label, severity, validate }] of Object.entries(PATTERNS)) {
    // Skip if pattern is disabled or below min severity
    if (!enabledPatterns.includes(type)) continue;
    if (severityOrder[severity] < minSeverityLevel) continue;

    const matches = text.matchAll(new RegExp(regex.source, regex.flags));
    for (const matchObj of matches) {
      const match = matchObj[0];

      // Skip if in allowlist
      if (allowlist.some((allowed) => match.includes(allowed))) continue;

      // Apply additional validation if defined
      if (validate && !validate(match)) continue;

      findings.push({ type, label, match, severity });
    }
  }

  return findings;
}

/**
 * Scans every message in a conversation array
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} config - Optional governance config
 * @returns {Array<{type: string, label: string, match: string, severity: string}>}
 */
export function scanMessages(messages, config = {}) {
  const findings = [];
  for (const msg of messages) {
    // Skip assistant messages (not user-supplied)
    if (msg.role === 'assistant') continue;
    findings.push(...scanForPII(msg.content, config));
  }
  return findings;
}

/**
 * Masks matched sensitive substrings for safe logging
 * @param {Array} findings
 * @returns {Array<{type: string, label: string, preview: string, severity: string}>}
 */
export function maskFindings(findings) {
  return findings.map((f) => ({
    type: f.type,
    label: f.label,
    severity: f.severity,
    preview: f.match.length > 6 ? `${f.match.slice(0, 3)}***${f.match.slice(-3)}` : '***',
  }));
}

/**
 * Default governance configuration
 */
export const DEFAULT_GOVERNANCE_CONFIG = {
  enabled: true,
  mode: 'BLOCK', // BLOCK, WARN, or ALLOW
  enabledPatterns: Object.keys(PATTERNS),
  allowlist: [],
  minSeverity: 'LOW',
};