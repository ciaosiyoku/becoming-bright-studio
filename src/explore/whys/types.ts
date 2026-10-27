export type WhyTopic = 'body' | 'nature' | 'sky' | 'home'

/** One "why": the question and a short, true answer in each language. */
export interface Why {
  id: string
  topic: WhyTopic
  emoji: string
  en: [question: string, answer: string]
  de: [question: string, answer: string]
  fr: [question: string, answer: string]
  yo: [question: string, answer: string]
}
