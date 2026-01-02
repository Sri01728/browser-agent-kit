import { describe, it, expect } from 'vitest';
import {
  parseA2UFromText,
  extractA2UComponent,
  containsA2U,
} from '../a2u-detector';

describe('parseA2UFromText', () => {
  describe('JSON code blocks', () => {
    it('should parse A2U from ```json code block', () => {
      const text = `Here are the flights:
\`\`\`json
{
  "version": "1.0",
  "type": "ui",
  "ui": { "type": "card", "props": { "title": "Flight to Paris" } }
}
\`\`\`
`;
      const result = parseA2UFromText(text);
      expect(result).not.toBeNull();
      expect(result?.version).toBe('1.0');
      expect(result?.type).toBe('ui');
      expect(result?.ui?.type).toBe('card');
      expect(result?.ui?.props?.title).toBe('Flight to Paris');
    });

    it('should parse A2U text type from code block', () => {
      const text = `\`\`\`json
{"version": "1.0", "type": "text", "text": "Hello, world!"}
\`\`\``;
      const result = parseA2UFromText(text);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('text');
      expect(result?.text).toBe('Hello, world!');
    });

    it('should handle plain code blocks with JSON', () => {
      const text = `\`\`\`
{"version": "1.0", "type": "ui", "ui": {"type": "button"}}
\`\`\``;
      const result = parseA2UFromText(text);
      expect(result).not.toBeNull();
      expect(result?.ui?.type).toBe('button');
    });
  });

  describe('raw JSON', () => {
    it('should parse raw A2U JSON in text', () => {
      const text = 'Found: {"version": "1.0", "type": "ui", "ui": {"type": "list"}}';
      const result = parseA2UFromText(text);
      expect(result).not.toBeNull();
      expect(result?.ui?.type).toBe('list');
    });

    it('should parse pure A2U JSON response', () => {
      const text = '{"version": "1.0", "type": "ui", "ui": {"type": "text"}}';
      const result = parseA2UFromText(text);
      expect(result).not.toBeNull();
      expect(result?.ui?.type).toBe('text');
    });

    it('should parse A2U with nested components', () => {
      const text = `{
        "version": "1.0",
        "type": "ui",
        "ui": {
          "type": "card",
          "children": [
            {"type": "text", "props": {"content": "Hello"}},
            {"type": "button", "props": {"label": "Click"}}
          ]
        }
      }`;
      const result = parseA2UFromText(text);
      expect(result?.ui?.children).toHaveLength(2);
      expect(result?.ui?.children?.[0].type).toBe('text');
      expect(result?.ui?.children?.[1].type).toBe('button');
    });
  });

  describe('version validation', () => {
    it('should accept valid version formats', () => {
      const versions = ['1.0', '2.1', '10.20'];
      for (const version of versions) {
        const text = `{"version": "${version}", "type": "text", "text": "test"}`;
        const result = parseA2UFromText(text);
        expect(result?.version).toBe(version);
      }
    });

    it('should reject invalid version formats', () => {
      const invalidVersions = ['1', '1.0.0', 'v1.0', ''];
      for (const version of invalidVersions) {
        const text = `{"version": "${version}", "type": "text", "text": "test"}`;
        const result = parseA2UFromText(text);
        expect(result).toBeNull();
      }
    });
  });

  describe('type validation', () => {
    it('should require ui field when type is ui', () => {
      const text = '{"version": "1.0", "type": "ui"}';
      const result = parseA2UFromText(text);
      expect(result).toBeNull();
    });

    it('should require text field when type is text', () => {
      const text = '{"version": "1.0", "type": "text"}';
      const result = parseA2UFromText(text);
      expect(result).toBeNull();
    });

    it('should reject invalid type values', () => {
      const text = '{"version": "1.0", "type": "invalid", "text": "test"}';
      const result = parseA2UFromText(text);
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return null for empty string', () => {
      expect(parseA2UFromText('')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(parseA2UFromText(null as unknown as string)).toBeNull();
      expect(parseA2UFromText(undefined as unknown as string)).toBeNull();
    });

    it('should return null for plain text', () => {
      expect(parseA2UFromText('Just a plain text response')).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      expect(parseA2UFromText('{ invalid json }')).toBeNull();
    });

    it('should return null for non-A2U JSON', () => {
      expect(parseA2UFromText('{"foo": "bar"}')).toBeNull();
    });

    it('should handle multiple code blocks (returns first valid)', () => {
      const text = `
\`\`\`json
{"invalid": "json"}
\`\`\`
\`\`\`json
{"version": "1.0", "type": "text", "text": "valid"}
\`\`\``;
      const result = parseA2UFromText(text);
      expect(result?.text).toBe('valid');
    });
  });

  describe('A2U components with actions', () => {
    it('should parse components with actions', () => {
      const text = `{
        "version": "1.0",
        "type": "ui",
        "ui": {
          "type": "button",
          "props": {"label": "Book"},
          "actions": [
            {"type": "call_tool", "params": {"tool": "book-flight", "args": {"id": "123"}}}
          ]
        }
      }`;
      const result = parseA2UFromText(text);
      expect(result?.ui?.actions).toHaveLength(1);
      expect(result?.ui?.actions?.[0].type).toBe('call_tool');
      expect(result?.ui?.actions?.[0].params?.tool).toBe('book-flight');
    });
  });
});

describe('extractA2UComponent', () => {
  it('should extract UI component from A2U response', () => {
    const text = '{"version": "1.0", "type": "ui", "ui": {"type": "card"}}';
    const component = extractA2UComponent(text);
    expect(component?.type).toBe('card');
  });

  it('should return undefined for text type', () => {
    const text = '{"version": "1.0", "type": "text", "text": "Hello"}';
    const component = extractA2UComponent(text);
    expect(component).toBeUndefined();
  });

  it('should return undefined when no A2U found', () => {
    const component = extractA2UComponent('No A2U here');
    expect(component).toBeUndefined();
  });
});

describe('containsA2U', () => {
  it('should return true when A2U is present', () => {
    const text = '{"version": "1.0", "type": "text", "text": "Hi"}';
    expect(containsA2U(text)).toBe(true);
  });

  it('should return false when no A2U', () => {
    expect(containsA2U('Plain text')).toBe(false);
    expect(containsA2U('')).toBe(false);
  });
});

