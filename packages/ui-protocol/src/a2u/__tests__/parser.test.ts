import { describe, it, expect } from 'vitest';
import {
  parseA2UResponse,
  safeParseA2UResponse,
  countComponents,
  getMaxDepth,
  validateComponentLimits,
} from '../parser';
import { A2UParseError, A2UValidationError } from '../errors';

describe('parseA2UResponse', () => {
  it('should parse valid UI response', () => {
    const input = JSON.stringify({
      version: '1.0',
      type: 'ui',
      ui: { type: 'card', props: { title: 'Test' } },
    });

    const result = parseA2UResponse(input);

    expect(result.version).toBe('1.0');
    expect(result.type).toBe('ui');
    expect(result.ui?.type).toBe('card');
    expect(result.ui?.props?.title).toBe('Test');
  });

  it('should parse valid text response', () => {
    const input = JSON.stringify({
      version: '1.0',
      type: 'text',
      text: 'Hello, world!',
    });

    const result = parseA2UResponse(input);

    expect(result.version).toBe('1.0');
    expect(result.type).toBe('text');
    expect(result.text).toBe('Hello, world!');
  });

  it('should throw A2UParseError for invalid JSON', () => {
    expect(() => parseA2UResponse('{ invalid json }')).toThrow(A2UParseError);
  });

  it('should throw A2UValidationError for invalid schema', () => {
    const input = JSON.stringify({ version: '1.0', type: 'invalid' });
    expect(() => parseA2UResponse(input)).toThrow(A2UValidationError);
  });

  it('should throw A2UValidationError for missing ui field when type=ui', () => {
    const input = JSON.stringify({ version: '1.0', type: 'ui' });
    expect(() => parseA2UResponse(input)).toThrow(A2UValidationError);
  });

  it('should throw A2UValidationError for invalid version format', () => {
    const input = JSON.stringify({ version: '1', type: 'text', text: 'Hi' });
    expect(() => parseA2UResponse(input)).toThrow(A2UValidationError);
  });

  it('should parse nested components', () => {
    const input = JSON.stringify({
      version: '1.0',
      type: 'ui',
      ui: {
        type: 'card',
        children: [
          { type: 'text', props: { content: 'Hello' } },
          { type: 'button', props: { label: 'Click' } },
        ],
      },
    });

    const result = parseA2UResponse(input);

    expect(result.ui?.children).toHaveLength(2);
    expect(result.ui?.children?.[0].type).toBe('text');
    expect(result.ui?.children?.[1].type).toBe('button');
  });

  it('should parse components with actions', () => {
    const input = JSON.stringify({
      version: '1.0',
      type: 'ui',
      ui: {
        type: 'button',
        actions: [
          { type: 'call_tool', params: { tool: 'test', args: {} } },
        ],
      },
    });

    const result = parseA2UResponse(input);

    expect(result.ui?.actions).toHaveLength(1);
    expect(result.ui?.actions?.[0].type).toBe('call_tool');
  });
});

describe('safeParseA2UResponse', () => {
  it('should return null for invalid JSON', () => {
    expect(safeParseA2UResponse('invalid')).toBeNull();
  });

  it('should return parsed response for valid JSON', () => {
    const input = JSON.stringify({
      version: '1.0',
      type: 'text',
      text: 'Hi',
    });

    const result = safeParseA2UResponse(input);
    expect(result?.text).toBe('Hi');
  });
});

describe('countComponents', () => {
  it('should count single component', () => {
    expect(countComponents({ type: 'text' })).toBe(1);
  });

  it('should count nested components', () => {
    const component = {
      type: 'card',
      children: [
        { type: 'text' },
        { type: 'button' },
        {
          type: 'list',
          children: [{ type: 'text' }, { type: 'text' }],
        },
      ],
    };

    expect(countComponents(component)).toBe(6);
  });
});

describe('getMaxDepth', () => {
  it('should return 1 for single component', () => {
    expect(getMaxDepth({ type: 'text' })).toBe(1);
  });

  it('should return correct depth for nested components', () => {
    const component = {
      type: 'card',
      children: [
        {
          type: 'list',
          children: [{ type: 'text' }],
        },
      ],
    };

    expect(getMaxDepth(component)).toBe(3);
  });
});

describe('validateComponentLimits', () => {
  it('should return valid for component within limits', () => {
    const result = validateComponentLimits({ type: 'text' }, 10, 100);
    expect(result.isValid).toBe(true);
  });

  it('should return invalid for depth exceeding limit', () => {
    const deepComponent = {
      type: 'a',
      children: [{
        type: 'b',
        children: [{ type: 'c' }],
      }],
    };

    const result = validateComponentLimits(deepComponent, 2, 100);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('depth');
  });

  it('should return invalid for count exceeding limit', () => {
    const manyComponents = {
      type: 'list',
      children: Array(10).fill({ type: 'text' }),
    };

    const result = validateComponentLimits(manyComponents, 10, 5);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('count');
  });
});

