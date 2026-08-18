import type { FeudQuestion } from "@/lib/feud/types";

/** Bundled fallback board — plays instantly with no API call. */
export const sampleFeudPack: FeudQuestion[] = [
  {
    question: "We asked 100 people: name something everyone complains about.",
    answers: [
      { text: "The traffic", points: 34 },
      { text: "The weather", points: 27 },
      { text: "Rent prices", points: 16 },
      { text: "Parking", points: 11 },
      { text: "Slow internet", points: 7 },
      { text: "Their boss", points: 5 },
    ],
  },
  {
    question: "Name something you always find in a living room.",
    answers: [
      { text: "A sofa", points: 31 },
      { text: "A TV", points: 25 },
      { text: "Cushions", points: 18 },
      { text: "A coffee table", points: 13 },
      { text: "A rug", points: 8 },
      { text: "Someone asleep", points: 5 },
    ],
  },
  {
    question: "Name a reason someone is late to a gathering.",
    answers: [
      { text: "Traffic", points: 36 },
      { text: "They overslept", points: 22 },
      { text: "Still getting ready", points: 17 },
      { text: "Got lost", points: 12 },
      { text: "Work ran over", points: 8 },
      { text: "Forgot completely", points: 5 },
    ],
  },
  {
    question: "Name something people take way too many photos of.",
    answers: [
      { text: "Food", points: 33 },
      { text: "Their car", points: 21 },
      { text: "Sunsets", points: 18 },
      { text: "Their cat", points: 14 },
      { text: "Their kids", points: 9 },
      { text: "Themselves in a mirror", points: 5 },
    ],
  },
  {
    question: "Name something you'd never lend to a friend.",
    answers: [
      { text: "Your car", points: 35 },
      { text: "Money", points: 26 },
      { text: "Your phone", points: 16 },
      { text: "Your charger", points: 11 },
      { text: "Your headphones", points: 7 },
      { text: "Your console", points: 5 },
    ],
  },
];
