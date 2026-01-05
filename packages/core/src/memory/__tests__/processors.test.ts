/**
 * Tests for Memory Processors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SummarizationProcessor } from '../processors/summarization-processor';
import { FilteringProcessor } from '../processors/filtering-processor';
import { MetadataExtractorProcessor } from '../processors/metadata-extractor-processor';
import { TTLProcessor } from '../processors/ttl-processor';
import type { Message } from '../../llm/types';

describe('SummarizationProcessor', () => {
  let processor: SummarizationProcessor;

  beforeEach(() => {
    processor = new SummarizationProcessor({
      maxMessages: 50,
      summarizeAfter: 10,
      keepRecent: 3,
    });
  });

  it('should not summarize if below threshold', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];

    const result = await processor.process(messages, {});

    expect(result.messages).toHaveLength(2);
    expect(result.messages).toEqual(messages);
  });

  it('should summarize when exceeding threshold', async () => {
    const messages: Message[] = Array.from({ length: 15 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));

    const result = await processor.process(messages, {});

    // Should have summary + recent messages
    expect(result.messages.length).toBeLessThan(messages.length);
    expect(result.messages[0].role).toBe('system');
    expect(result.messages[0].content).toContain('Summary');
  });

  it('should keep recent messages', async () => {
    const messages: Message[] = Array.from({ length: 15 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));

    const result = await processor.process(messages, {});

    // Should keep last 3 messages + summary
    expect(result.messages).toHaveLength(4); // 1 summary + 3 recent
    expect(result.messages[1].content).toBe('Message 12');
    expect(result.messages[2].content).toBe('Message 13');
    expect(result.messages[3].content).toBe('Message 14');
  });

  it('should update metadata', async () => {
    const messages: Message[] = Array.from({ length: 15 }, (_, i) => ({
      role: 'user',
      content: `Message ${i}`,
    }));

    const result = await processor.process(messages, {});

    expect(result.metadata.summarizedMessages).toBe(12);
    expect(result.metadata.lastSummarizedAt).toBeDefined();
  });
});

describe('FilteringProcessor', () => {
  it('should remove system messages', async () => {
    const processor = new FilteringProcessor({ removeSystemMessages: true });
    const messages: Message[] = [
      { role: 'system', content: 'System message' },
      { role: 'user', content: 'User message' },
      { role: 'assistant', content: 'Assistant message' },
    ];

    const result = await processor.process(messages, {});

    expect(result.messages).toHaveLength(2);
    expect(result.messages.every((m) => m.role !== 'system')).toBe(true);
  });

  it('should remove empty messages', async () => {
    const processor = new FilteringProcessor({ removeEmptyMessages: true });
    const messages: Message[] = [
      { role: 'user', content: 'Valid message' },
      { role: 'user', content: '' },
      { role: 'user', content: '   ' },
      { role: 'assistant', content: 'Another valid' },
    ];

    const result = await processor.process(messages, {});

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe('Valid message');
    expect(result.messages[1].content).toBe('Another valid');
  });

  it('should remove messages by role', async () => {
    const processor = new FilteringProcessor({ removeRoles: ['tool'] });
    const messages: Message[] = [
      { role: 'user', content: 'User' },
      { role: 'tool', content: 'Tool result' },
      { role: 'assistant', content: 'Assistant' },
    ];

    const result = await processor.process(messages, {});

    expect(result.messages).toHaveLength(2);
    expect(result.messages.every((m) => m.role !== 'tool')).toBe(true);
  });

  it('should apply custom filter', async () => {
    const processor = new FilteringProcessor({
      customFilter: (m) => {
        const content = typeof m.content === 'string' ? m.content : '';
        return content.length > 5;
      },
    });

    const messages: Message[] = [
      { role: 'user', content: 'Hi' },
      { role: 'user', content: 'Hello there!' },
      { role: 'user', content: 'Hey' },
    ];

    const result = await processor.process(messages, {});

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toBe('Hello there!');
  });

  it('should update metadata with filtered count', async () => {
    const processor = new FilteringProcessor({ removeSystemMessages: true });
    const messages: Message[] = [
      { role: 'system', content: 'System 1' },
      { role: 'system', content: 'System 2' },
      { role: 'user', content: 'User' },
    ];

    const result = await processor.process(messages, {});

    expect(result.metadata.filteredMessages).toBe(2);
    expect(result.metadata.lastFilteredAt).toBeDefined();
  });
});

describe('MetadataExtractorProcessor', () => {
  it('should extract topics', async () => {
    const processor = new MetadataExtractorProcessor({ extractTopics: true });
    const messages: Message[] = [
      { role: 'user', content: 'I want to book a flight to Paris' },
      { role: 'assistant', content: 'I can help you with that booking' },
    ];

    const result = await processor.process(messages, {});

    expect(result.metadata.extracted).toBeDefined();
    const extracted = result.metadata.extracted as Record<string, unknown>;
    expect(extracted.topics).toBeDefined();
    expect(Array.isArray(extracted.topics)).toBe(true);
  });

  it('should extract entities', async () => {
    const processor = new MetadataExtractorProcessor({ extractEntities: true });
    const messages: Message[] = [
      { role: 'user', content: 'I want to fly to Paris from New York' },
      { role: 'assistant', content: 'Great! Air France has flights to Paris' },
    ];

    const result = await processor.process(messages, {});

    const extracted = result.metadata.extracted as Record<string, unknown>;
    expect(extracted.entities).toBeDefined();
    const entities = extracted.entities as Record<string, string[]>;
    expect(entities.places).toBeDefined();
    expect(entities.organizations).toBeDefined();
  });

  it('should extract sentiment', async () => {
    const processor = new MetadataExtractorProcessor({ extractSentiment: true });
    const messages: Message[] = [
      { role: 'user', content: 'This is great! I love it!' },
      { role: 'assistant', content: 'Thank you! Happy to help!' },
    ];

    const result = await processor.process(messages, {});

    const extracted = result.metadata.extracted as Record<string, unknown>;
    expect(extracted.sentiment).toBeDefined();
    const sentiment = extracted.sentiment as { overall: string; score: number };
    expect(sentiment.overall).toBe('positive');
    expect(sentiment.score).toBeGreaterThan(0);
  });

  it('should handle negative sentiment', async () => {
    const processor = new MetadataExtractorProcessor({ extractSentiment: true });
    const messages: Message[] = [
      { role: 'user', content: 'This is terrible! I hate it!' },
      { role: 'assistant', content: 'I apologize for the problem' },
    ];

    const result = await processor.process(messages, {});

    const extracted = result.metadata.extracted as Record<string, unknown>;
    const sentiment = extracted.sentiment as { overall: string; score: number };
    expect(sentiment.overall).toBe('negative');
    expect(sentiment.score).toBeLessThan(0);
  });

  it('should run custom extractors', async () => {
    const processor = new MetadataExtractorProcessor({
      customExtractors: [
        {
          name: 'messageCount',
          extract: (messages) => ({ count: messages.length }),
        },
      ],
    });

    const messages: Message[] = [
      { role: 'user', content: 'Message 1' },
      { role: 'assistant', content: 'Message 2' },
    ];

    const result = await processor.process(messages, {});

    const extracted = result.metadata.extracted as Record<string, unknown>;
    expect(extracted.messageCount).toEqual({ count: 2 });
  });

  it('should update metadata with extraction timestamp', async () => {
    const processor = new MetadataExtractorProcessor({ extractTopics: true });
    const messages: Message[] = [{ role: 'user', content: 'Test' }];

    const result = await processor.process(messages, {});

    expect(result.metadata.lastExtractedAt).toBeDefined();
  });
});

describe('TTLProcessor', () => {
  it('should set TTL metadata', async () => {
    const processor = new TTLProcessor({
      defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const messages: Message[] = [{ role: 'user', content: 'Test' }];
    const result = await processor.process(messages, {});

    expect(result.metadata.ttl).toBe(7 * 24 * 60 * 60 * 1000);
    expect(result.metadata.expiresAt).toBeDefined();
    expect(result.metadata.ttlUpdatedAt).toBeDefined();
  });

  it('should use resource-specific TTL', async () => {
    const processor = new TTLProcessor({
      defaultTTL: 7 * 24 * 60 * 60 * 1000,
      ttlByResourceType: {
        session: 1 * 24 * 60 * 60 * 1000, // 1 day for sessions
      },
    });

    const messages: Message[] = [{ role: 'user', content: 'Test' }];
    const result = await processor.process(messages, { resourceType: 'session' });

    expect(result.metadata.ttl).toBe(1 * 24 * 60 * 60 * 1000);
  });

  it('should calculate correct expiration time', async () => {
    const processor = new TTLProcessor({
      defaultTTL: 1000, // 1 second
    });

    const before = Date.now();
    const messages: Message[] = [{ role: 'user', content: 'Test' }];
    const result = await processor.process(messages, {});
    const after = Date.now();

    const expiresAt = new Date(result.metadata.expiresAt as string).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + 1000);
    expect(expiresAt).toBeLessThanOrEqual(after + 1000);
  });
});

describe('Processor Integration', () => {
  it('should chain multiple processors', async () => {
    const filtering = new FilteringProcessor({ removeSystemMessages: true });
    const metadata = new MetadataExtractorProcessor({ extractTopics: true });

    const messages: Message[] = [
      { role: 'system', content: 'System' },
      { role: 'user', content: 'I want to book a flight to Paris' },
    ];

    // Run through filtering first
    const filtered = await filtering.process(messages, {});
    
    // Then through metadata extraction
    const final = await metadata.process(filtered.messages, filtered.metadata);

    expect(final.messages).toHaveLength(1);
    expect(final.messages[0].role).toBe('user');
    expect(final.metadata.filteredMessages).toBe(1);
    expect(final.metadata.extracted).toBeDefined();
  });
});

