/**
 * Example weather tool
 */

import { z } from 'zod';
import type { ToolDefinition } from '@web-agent/core';

export const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get the current weather for a location',
  parameters: z.object({
    location: z.string().describe('The city and state, e.g. San Francisco, CA'),
    unit: z.enum(['celsius', 'fahrenheit']).optional().default('fahrenheit'),
  }),
  execute: async ({ location, unit }) => {
    // In a real app, you'd call a weather API here
    // For demo purposes, return mock data
    const temp = unit === 'celsius' ? 22 : 72;
    
    return {
      location,
      temperature: temp,
      unit,
      conditions: 'Sunny',
      humidity: 65,
      wind_speed: 10,
    };
  },
};

