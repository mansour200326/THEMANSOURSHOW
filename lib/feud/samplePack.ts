import type { FeudQuestion } from "@/lib/feud/types";

/**
 * Bundled fallback board — plays instantly with no API call.
 *
 * Every answer carries the other things people actually shout for it, because
 * nobody says "themselves in a mirror", they say "selfies". Generated packs get
 * the same list written for them; this one is by hand so the game still judges
 * properly with no API key. Nothing listed here may also pass for another
 * answer in the same round.
 */
export const sampleFeudPack: FeudQuestion[] = [
  {
    question: "We asked 100 people: name something everyone complains about.",
    answers: [
      {
        text: "The traffic",
        points: 34,
        accept: ["traffic", "traffic jams", "the roads", "congestion", "the commute"],
      },
      {
        text: "The weather",
        points: 27,
        accept: ["weather", "the heat", "the rain", "the cold", "how hot it is"],
      },
      {
        text: "Rent prices",
        points: 16,
        accept: ["rent", "the rent", "housing costs", "cost of living", "bills"],
      },
      {
        text: "Parking",
        points: 11,
        accept: ["no parking", "parking spaces", "finding parking", "the car park"],
      },
      {
        text: "Slow internet",
        points: 7,
        accept: ["the wifi", "bad wifi", "slow wifi", "the internet", "buffering"],
      },
      {
        text: "Their boss",
        points: 5,
        accept: ["boss", "the boss", "their manager", "management"],
      },
    ],
  },
  {
    question: "Name something you always find in a living room.",
    answers: [
      { text: "A sofa", points: 31, accept: ["couch", "settee", "the sofa", "seats"] },
      { text: "A TV", points: 25, accept: ["television", "telly", "the screen", "a telly"] },
      {
        text: "Cushions",
        points: 18,
        accept: ["pillows", "throw pillows", "a cushion"],
      },
      {
        text: "A coffee table",
        points: 13,
        accept: ["a table", "side table", "the table"],
      },
      { text: "A rug", points: 8, accept: ["carpet", "a mat", "the carpet"] },
      {
        text: "Someone asleep",
        points: 5,
        accept: ["someone napping", "dad asleep", "a sleeping person", "someone sleeping"],
      },
    ],
  },
  {
    question: "Name a reason someone is late to a gathering.",
    answers: [
      {
        text: "Traffic",
        points: 36,
        accept: ["the traffic", "traffic jams", "the roads", "stuck in traffic"],
      },
      {
        text: "They overslept",
        points: 22,
        accept: ["overslept", "slept in", "woke up late", "they were asleep"],
      },
      {
        text: "Still getting ready",
        points: 17,
        accept: ["getting ready", "doing their hair", "picking an outfit", "in the shower"],
      },
      {
        text: "Got lost",
        points: 12,
        accept: ["lost", "wrong directions", "couldn't find it", "bad directions"],
      },
      {
        text: "Work ran over",
        points: 8,
        accept: ["stuck at work", "a late meeting", "still at work", "their job"],
      },
      {
        text: "Forgot completely",
        points: 5,
        accept: ["forgot", "they forgot", "forgot about it", "it slipped their mind"],
      },
    ],
  },
  {
    question: "Name something people take way too many photos of.",
    answers: [
      {
        text: "Food",
        points: 33,
        accept: ["their dinner", "their lunch", "meals", "brunch", "dessert", "coffee"],
      },
      { text: "Their car", points: 21, accept: ["cars", "a new car", "their ride"] },
      { text: "Sunsets", points: 18, accept: ["the sunset", "sunrise", "the sky", "the view"] },
      {
        text: "Their cat",
        points: 14,
        accept: ["cats", "a kitten", "their pet", "the cat"],
      },
      { text: "Their kids", points: 9, accept: ["kids", "their baby", "children", "their son"] },
      {
        text: "Themselves in a mirror",
        points: 5,
        accept: ["selfies", "a selfie", "mirror selfie", "themselves"],
      },
    ],
  },
  {
    question: "Name something you'd never lend to a friend.",
    answers: [
      {
        text: "Your car",
        points: 35,
        accept: ["my car", "the car", "car keys", "your vehicle"],
      },
      { text: "Money", points: 26, accept: ["cash", "a loan", "lending money", "your salary"] },
      { text: "Your phone", points: 16, accept: ["my phone", "mobile", "iphone", "the phone"] },
      {
        text: "Your charger",
        points: 11,
        accept: ["phone charger", "a cable", "charging cable", "my charger"],
      },
      {
        text: "Your headphones",
        points: 7,
        accept: ["earphones", "airpods", "earbuds", "my headphones"],
      },
      {
        text: "Your console",
        points: 5,
        accept: ["playstation", "xbox", "ps5", "games console", "my console"],
      },
    ],
  },
];
