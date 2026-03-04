import type { Profile } from '@/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callAI(messages: { role: string; content: string }[], model = 'anthropic/claude-sonnet-4') {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'MentorHub',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function getRecommendedMentors(
  menteeProfile: { interests: string[]; goals: string },
  mentors: Profile[]
): Promise<{ mentor_id: string; score: number; reasoning: string }[]> {
  const mentorSummaries = mentors.map(m => ({
    id: m.id,
    name: m.full_name,
    expertise: m.expertise_tags,
    bio: m.bio?.substring(0, 200),
    rating: m.rating,
    hourly_rate: m.hourly_rate,
    sessions: m.total_sessions,
  }));

  const prompt = `You are a mentor matching AI. Given a mentee's profile and a list of mentors, recommend the top 5 most suitable mentors.

MENTEE:
- Interests: ${menteeProfile.interests.join(', ')}
- Goals: ${menteeProfile.goals}

MENTORS:
${JSON.stringify(mentorSummaries, null, 2)}

Return ONLY valid JSON array with objects having: mentor_id, score (0-100), reasoning (1-2 sentences).
No markdown, no extra text. Just the JSON array.`;

  const result = await callAI([{ role: 'user', content: prompt }]);

  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

export async function suggestAgenda(topic: string, durationMinutes: number): Promise<string> {
  const prompt = `Create a meeting agenda for a mentoring session.
Topic: ${topic}
Duration: ${durationMinutes} minutes

Return ONLY a valid JSON array of objects with: title, duration_minutes, description.
Total duration must equal ${durationMinutes} minutes. No markdown. Just JSON.`;

  const result = await callAI([{ role: 'user', content: prompt }]);

  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    JSON.parse(cleaned); // validate
    return cleaned;
  } catch {
    return '[]';
  }
}

export async function findOptimalSlots(
  mentorAvailability: { day: number; start: string; end: string }[],
  participantPreferences: { preferred_times: string[] }[]
): Promise<string> {
  const prompt = `You are a scheduling AI. Find the best meeting slots.

MENTOR AVAILABILITY (day 0=Sun, 1=Mon...):
${JSON.stringify(mentorAvailability)}

PARTICIPANT PREFERENCES:
${JSON.stringify(participantPreferences)}

Suggest the top 3 optimal time slots considering all constraints.
Return ONLY valid JSON array of objects with: day_of_week, start_time, end_time, score (0-100), reasoning.
No markdown, no extra text.`;

  const result = await callAI([{ role: 'user', content: prompt }]);

  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    return '[]';
  }
}

// Aliases used by API routes
export const getRecommendations = getRecommendedMentors;
export const optimizeSlots = findOptimalSlots;
