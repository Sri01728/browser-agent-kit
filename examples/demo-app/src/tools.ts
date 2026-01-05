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
    // Mock weather data
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

export const flightSearchTool: ToolDefinition = {
  name: 'search_flights',
  description: 'Search for flights between two cities',
  parameters: z.object({
    from: z.string().describe('Departure city'),
    to: z.string().describe('Destination city'),
    date: z.string().optional().describe('Departure date (YYYY-MM-DD)'),
  }),
  execute: async ({ from, to, date }) => {
    // Mock flight data
    return {
      flights: [
        {
          id: 'AA123',
          airline: 'American Airlines',
          from,
          to,
          departure: '9:00 AM',
          arrival: '12:00 PM',
          price: 299,
          duration: '3h',
        },
        {
          id: 'UA456',
          airline: 'United Airlines',
          from,
          to,
          departure: '2:00 PM',
          arrival: '5:00 PM',
          price: 349,
          duration: '3h',
        },
        {
          id: 'DL789',
          airline: 'Delta Airlines',
          from,
          to,
          departure: '6:00 PM',
          arrival: '9:00 PM',
          price: 279,
          duration: '3h',
        },
      ],
    };
  },
};

