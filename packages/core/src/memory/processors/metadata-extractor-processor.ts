/**
 * Metadata Extractor Processor
 * 
 * Extracts metadata from messages (topics, entities, sentiment, etc.).
 */

import type { Message } from '../../llm/types';
import type { MemoryProcessor, MetadataExtractorOptions } from '../enhanced-types';

export class MetadataExtractorProcessor implements MemoryProcessor {
  name = 'metadata-extractor';
  priority = 15; // Run after summarization

  private options: MetadataExtractorOptions;

  constructor(options: MetadataExtractorOptions = {}) {
    this.options = options;
  }

  async process(
    messages: Message[],
    metadata: Record<string, unknown>
  ): Promise<{
    messages: Message[];
    metadata: Record<string, unknown>;
  }> {
    const extracted: Record<string, unknown> = {};

    // Extract topics if configured
    if (this.options.extractTopics) {
      extracted.topics = this.extractTopics(messages);
    }

    // Extract entities if configured
    if (this.options.extractEntities) {
      extracted.entities = this.extractEntities(messages);
    }

    // Extract sentiment if configured
    if (this.options.extractSentiment) {
      extracted.sentiment = this.extractSentiment(messages);
    }

    // Run custom extractors if provided
    if (this.options.customExtractors) {
      for (const extractor of this.options.customExtractors) {
        try {
          const result = extractor.extract(messages);
          extracted[extractor.name] = result;
        } catch (error) {
          console.error(`Custom extractor ${extractor.name} failed:`, error);
        }
      }
    }

    // Merge with existing metadata
    const newMetadata = {
      ...metadata,
      extracted: {
        ...(metadata.extracted as Record<string, unknown> || {}),
        ...extracted,
      },
      lastExtractedAt: new Date().toISOString(),
    };

    return {
      messages,
      metadata: newMetadata,
    };
  }

  /**
   * Extract topics from messages
   */
  private extractTopics(messages: Message[]): string[] {
    const topics = new Set<string>();
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);

    for (const message of messages) {
      const content = typeof message.content === 'string' ? message.content.toLowerCase() : '';
      
      // Extract capitalized words (potential topics)
      const capitalizedWords = (typeof message.content === 'string' ? message.content : '')
        .match(/\b[A-Z][a-z]+\b/g) || [];
      
      capitalizedWords.forEach((word) => {
        if (!stopWords.has(word.toLowerCase())) {
          topics.add(word);
        }
      });

      // Extract common nouns (simple approach)
      const words = content.split(/\s+/).filter((w) => w.length > 4 && !stopWords.has(w));
      words.slice(0, 3).forEach((word) => topics.add(word));
    }

    return Array.from(topics).slice(0, 10);
  }

  /**
   * Extract entities from messages (simple NER)
   */
  private extractEntities(messages: Message[]): Record<string, string[]> {
    const entities: Record<string, string[]> = {
      people: [],
      places: [],
      organizations: [],
    };

    for (const message of messages) {
      const content = typeof message.content === 'string' ? message.content : '';
      
      // Extract potential person names (capitalized words in sequence)
      const personNames = content.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || [];
      entities.people.push(...personNames);

      // Extract potential places (words after "in", "at", "to")
      const placeMatches = content.match(/(?:in|at|to) ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g) || [];
      const places = placeMatches.map((m) => m.replace(/^(?:in|at|to) /, ''));
      entities.places.push(...places);

      // Extract potential organizations (capitalized multi-word phrases)
      const orgMatches = content.match(/\b[A-Z][a-z]+(?: [A-Z][a-z]+){1,2}\b/g) || [];
      entities.organizations.push(...orgMatches);
    }

    // Deduplicate and limit
    entities.people = [...new Set(entities.people)].slice(0, 5);
    entities.places = [...new Set(entities.places)].slice(0, 5);
    entities.organizations = [...new Set(entities.organizations)].slice(0, 5);

    return entities;
  }

  /**
   * Extract sentiment from messages (simple sentiment analysis)
   */
  private extractSentiment(messages: Message[]): {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
  } {
    const positiveWords = new Set([
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied',
      'thank', 'thanks', 'appreciate', 'helpful', 'perfect',
    ]);

    const negativeWords = new Set([
      'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst',
      'hate', 'dislike', 'unhappy', 'disappointed', 'frustrated',
      'problem', 'issue', 'error', 'wrong', 'broken', 'fail',
    ]);

    let positiveCount = 0;
    let negativeCount = 0;

    for (const message of messages) {
      const content = typeof message.content === 'string' ? message.content.toLowerCase() : '';
      const words = content.split(/\s+/);

      for (const word of words) {
        if (positiveWords.has(word)) {
          positiveCount++;
        } else if (negativeWords.has(word)) {
          negativeCount++;
        }
      }
    }

    const total = positiveCount + negativeCount;
    const score = total > 0 ? (positiveCount - negativeCount) / total : 0;

    let overall: 'positive' | 'neutral' | 'negative';
    if (score > 0.2) {
      overall = 'positive';
    } else if (score < -0.2) {
      overall = 'negative';
    } else {
      overall = 'neutral';
    }

    return { overall, score };
  }
}

