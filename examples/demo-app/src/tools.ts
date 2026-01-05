import { z } from 'zod';
import { createTool } from '@web-agent/core';

export const weatherTool = createTool({
  id: 'get_weather',
  description: 'Get the current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('The city and state, e.g. San Francisco, CA'),
    unit: z.enum(['celsius', 'fahrenheit']).optional().default('fahrenheit'),
  }),
  outputSchema: z.object({
    location: z.string(),
    temperature: z.number(),
    unit: z.string(),
    conditions: z.string(),
    humidity: z.number(),
    wind_speed: z.number(),
  }),
  execute: async ({ location, unit }) => {
    // Mock weather data
    const temp = unit === 'celsius' ? 22 : 72;
    return {
      location,
      temperature: temp,
      unit: unit || 'fahrenheit',
      conditions: 'Sunny',
      humidity: 65,
      wind_speed: 10,
    };
  },
});

export const flightSearchTool = createTool({
  id: 'search_flights',
  description: 'Search for flights between two cities',
  inputSchema: z.object({
    from: z.string().describe('Departure city'),
    to: z.string().describe('Destination city'),
    date: z.string().optional().describe('Departure date (YYYY-MM-DD)'),
  }),
  outputSchema: z.object({
    flights: z.array(z.object({
      id: z.string(),
      airline: z.string(),
      from: z.string(),
      to: z.string(),
      departure: z.string(),
      arrival: z.string(),
      price: z.number(),
      duration: z.string(),
    })),
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
});

