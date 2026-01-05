/**
 * Chat template utilities for different model families
 * 
 * This module provides model-specific chat templates and function calling support.
 */

import type { Message, ToolDefinition } from '@web-agent/core';
import type { ModelFamily, ToolDefinitionForTemplate } from './types';

/**
 * Format messages for Phi models (Phi-2, Phi-3)
 * 
 * Phi models use a simple format with special tokens
 */
export function formatPhiChat(messages: Message[], tools?: ToolDefinition[]): string {
  let prompt = '';
  
  // Add system message if present
  const systemMsg = messages.find(m => m.role === 'system');
  if (systemMsg) {
    prompt += `System: ${systemMsg.content}\n\n`;
  }
  
  // Add tools if provided
  if (tools && tools.length > 0) {
    prompt += formatToolsForPhi(tools);
  }
  
  // Format conversation
  for (const msg of messages) {
    if (msg.role === 'system') continue; // Already handled
    
    if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n`;
    } else if (msg.role === 'assistant') {
      prompt += `Assistant: ${msg.content}\n`;
    }
  }
  
  prompt += 'Assistant:';
  return prompt;
}

/**
 * Format messages for Llama models (Llama-2, Llama-3)
 * 
 * Llama uses special tokens: <s>, [INST], [/INST], <<SYS>>, <</SYS>>
 */
export function formatLlamaChat(messages: Message[], tools?: ToolDefinition[]): string {
  let prompt = '<s>';
  
  // Add system message with tools if present
  const systemMsg = messages.find(m => m.role === 'system');
  const systemContent = systemMsg?.content || 'You are a helpful assistant.';
  
  let systemPrompt = systemContent;
  if (tools && tools.length > 0) {
    systemPrompt += '\n\n' + formatToolsForLlama(tools);
  }
  
  // First message with system
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (firstUserMsg) {
    prompt += `[INST] <<SYS>>\n${systemPrompt}\n<</SYS>>\n\n${firstUserMsg.content} [/INST]`;
    
    // Add remaining messages
    let skipFirst = false;
    for (const msg of messages) {
      if (msg.role === 'system') continue;
      if (msg.role === 'user' && !skipFirst) {
        skipFirst = true;
        continue;
      }
      
      if (msg.role === 'user') {
        prompt += ` <s>[INST] ${msg.content} [/INST]`;
      } else if (msg.role === 'assistant') {
        prompt += ` ${msg.content}</s>`;
      }
    }
  }
  
  return prompt;
}

/**
 * Format messages for Mistral models
 * 
 * Mistral uses [INST] tags similar to Llama but with different structure
 */
export function formatMistralChat(messages: Message[], tools?: ToolDefinition[]): string {
  let prompt = '';
  
  // Add system message with tools if present
  const systemMsg = messages.find(m => m.role === 'system');
  if (systemMsg || (tools && tools.length > 0)) {
    let systemContent = systemMsg?.content || 'You are a helpful assistant.';
    if (tools && tools.length > 0) {
      systemContent += '\n\n' + formatToolsForMistral(tools);
    }
    prompt += `<s>[INST] ${systemContent} [/INST]</s>\n`;
  }
  
  // Format conversation
  for (const msg of messages) {
    if (msg.role === 'system') continue; // Already handled
    
    if (msg.role === 'user') {
      prompt += `<s>[INST] ${msg.content} [/INST]`;
    } else if (msg.role === 'assistant') {
      prompt += ` ${msg.content}</s>\n`;
    }
  }
  
  return prompt;
}

/**
 * Format messages for Gemma models
 * 
 * Gemma uses <start_of_turn> and <end_of_turn> tokens
 */
export function formatGemmaChat(messages: Message[], tools?: ToolDefinition[]): string {
  let prompt = '';
  
  // Add system message with tools if present
  const systemMsg = messages.find(m => m.role === 'system');
  if (systemMsg || (tools && tools.length > 0)) {
    let systemContent = systemMsg?.content || 'You are a helpful assistant.';
    if (tools && tools.length > 0) {
      systemContent += '\n\n' + formatToolsForGemma(tools);
    }
    prompt += `<start_of_turn>system\n${systemContent}<end_of_turn>\n`;
  }
  
  // Format conversation
  for (const msg of messages) {
    if (msg.role === 'system') continue; // Already handled
    
    if (msg.role === 'user') {
      prompt += `<start_of_turn>user\n${msg.content}<end_of_turn>\n`;
    } else if (msg.role === 'assistant') {
      prompt += `<start_of_turn>model\n${msg.content}<end_of_turn>\n`;
    }
  }
  
  prompt += '<start_of_turn>model\n';
  return prompt;
}

/**
 * Format messages for GPT-2 and simple models
 */
export function formatSimpleChat(messages: Message[], tools?: ToolDefinition[]): string {
  let prompt = '';
  
  // Add tools if provided
  if (tools && tools.length > 0) {
    prompt += formatToolsSimple(tools) + '\n\n';
  }
  
  // Simple format: concatenate messages
  prompt += messages
    .map((msg) => {
      if (msg.role === 'system') {
        return `System: ${msg.content}`;
      } else if (msg.role === 'user') {
        return `User: ${msg.content}`;
      } else if (msg.role === 'assistant') {
        return `Assistant: ${msg.content}`;
      }
      return msg.content;
    })
    .join('\n\n');
  
  prompt += '\n\nAssistant:';
  return prompt;
}

/**
 * Format tools for Phi models
 */
function formatToolsForPhi(tools: ToolDefinition[]): string {
  let toolsText = 'Available Tools:\n\n';
  
  for (const tool of tools) {
    toolsText += `Tool: ${tool.name}\n`;
    toolsText += `Description: ${tool.description}\n`;
    toolsText += `Parameters: ${JSON.stringify(tool.parameters, null, 2)}\n\n`;
  }
  
  toolsText += 'To use a tool, respond with: TOOL_CALL: {\"name\": \"tool_name\", \"arguments\": {...}}\n\n';
  return toolsText;
}

/**
 * Format tools for Llama models
 */
function formatToolsForLlama(tools: ToolDefinition[]): string {
  let toolsText = 'You have access to the following tools:\n\n';
  
  for (const tool of tools) {
    toolsText += `[TOOL: ${tool.name}]\n`;
    toolsText += `Description: ${tool.description}\n`;
    toolsText += `Parameters: ${JSON.stringify(tool.parameters, null, 2)}\n\n`;
  }
  
  toolsText += 'To call a tool, use this exact format:\n';
  toolsText += '<tool_call>\n{"name": "tool_name", "arguments": {...}}\n</tool_call>';
  return toolsText;
}

/**
 * Format tools for Mistral models
 */
function formatToolsForMistral(tools: ToolDefinition[]): string {
  let toolsText = 'Available functions:\n\n';
  
  for (const tool of tools) {
    toolsText += `Function: ${tool.name}\n`;
    toolsText += `Description: ${tool.description}\n`;
    toolsText += `Schema: ${JSON.stringify(tool.parameters, null, 2)}\n\n`;
  }
  
  toolsText += 'To call a function, respond with JSON: {\"function\": \"name\", \"parameters\": {...}}';
  return toolsText;
}

/**
 * Format tools for Gemma models
 */
function formatToolsForGemma(tools: ToolDefinition[]): string {
  let toolsText = 'Tools available:\n\n';
  
  for (const tool of tools) {
    toolsText += `- ${tool.name}: ${tool.description}\n`;
    toolsText += `  Parameters: ${JSON.stringify(tool.parameters, null, 2)}\n`;
  }
  
  toolsText += '\nTo use a tool, output: CALL_TOOL(tool_name, {parameters})';
  return toolsText;
}

/**
 * Format tools for simple models
 */
function formatToolsSimple(tools: ToolDefinition[]): string {
  let toolsText = 'You can use these tools:\n';
  
  for (const tool of tools) {
    toolsText += `\n${tool.name}: ${tool.description}`;
  }
  
  toolsText += '\n\nTo use a tool, say: USE_TOOL tool_name with parameters {...}';
  return toolsText;
}

/**
 * Parse tool calls from model output
 */
export function parseToolCalls(text: string, modelFamily: ModelFamily): Array<{
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}> | undefined {
  const toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }> = [];
  
  try {
    switch (modelFamily) {
      case 'phi':
        return parsePhiToolCalls(text);
      case 'llama':
        return parseLlamaToolCalls(text);
      case 'mistral':
        return parseMistralToolCalls(text);
      case 'gemma':
        return parseGemmaToolCalls(text);
      default:
        return parseSimpleToolCalls(text);
    }
  } catch (error) {
    // If parsing fails, return undefined (no tool calls)
    return undefined;
  }
}

function parsePhiToolCalls(text: string) {
  const match = text.match(/TOOL_CALL:\s*(\{.*\})/s);
  if (!match) return undefined;
  
  try {
    const call = JSON.parse(match[1]);
    return [{
      id: `call-${Date.now()}`,
      name: call.name,
      arguments: call.arguments || {},
    }];
  } catch {
    return undefined;
  }
}

function parseLlamaToolCalls(text: string) {
  const match = text.match(/<tool_call>\s*(.*?)\s*<\/tool_call>/s);
  if (!match) return undefined;
  
  try {
    const call = JSON.parse(match[1]);
    return [{
      id: `call-${Date.now()}`,
      name: call.name,
      arguments: call.arguments || {},
    }];
  } catch {
    return undefined;
  }
}

function parseMistralToolCalls(text: string) {
  // Try to parse the entire text as JSON first
  try {
    const call = JSON.parse(text.trim());
    if (call.function) {
      return [{
        id: `call-${Date.now()}`,
        name: call.function,
        arguments: call.parameters || {},
      }];
    }
  } catch {
    // If that fails, try to find JSON object with "function" key
    const jsonMatch = text.match(/\{[^{}]*"function"[^{}]*"parameters"[^{}]*\}/);
    if (jsonMatch) {
      try {
        const call = JSON.parse(jsonMatch[0]);
        return [{
          id: `call-${Date.now()}`,
          name: call.function,
          arguments: call.parameters || {},
        }];
      } catch {
        return undefined;
      }
    }
  }
  
  return undefined;
}

function parseGemmaToolCalls(text: string) {
  const match = text.match(/CALL_TOOL\(([^,]+),\s*(\{.*?\})\)/s);
  if (!match) return undefined;
  
  try {
    return [{
      id: `call-${Date.now()}`,
      name: match[1].trim(),
      arguments: JSON.parse(match[2]),
    }];
  } catch {
    return undefined;
  }
}

function parseSimpleToolCalls(text: string) {
  const match = text.match(/USE_TOOL\s+(\w+)\s+with\s+parameters\s+(\{.*?\})/s);
  if (!match) return undefined;
  
  try {
    return [{
      id: `call-${Date.now()}`,
      name: match[1],
      arguments: JSON.parse(match[2]),
    }];
  } catch {
    return undefined;
  }
}

/**
 * Detect model family from model path
 */
export function detectModelFamily(modelPath: string): ModelFamily {
  const lowerPath = modelPath.toLowerCase();
  
  if (lowerPath.includes('phi')) return 'phi';
  if (lowerPath.includes('llama')) return 'llama';
  if (lowerPath.includes('mistral')) return 'mistral';
  if (lowerPath.includes('gemma')) return 'gemma';
  if (lowerPath.includes('gpt2') || lowerPath.includes('gpt-2')) return 'gpt2';
  if (lowerPath.includes('qwen')) return 'qwen';
  
  return 'unknown';
}

