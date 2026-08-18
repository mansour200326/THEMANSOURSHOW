import type { Board, FinalClue } from "@/lib/board/types";

/**
 * Bundled stand-in board. The AI generator in lib/ai.ts returns this exact
 * shape, so nothing downstream can tell the difference.
 */
export const sampleBoard: Board = {
  title: "House Board",
  categories: [
    {
      title: "WORLD LANDMARKS",
      clues: [
        { value: 100, clue: "This Paris tower was the world's tallest structure until 1930.", answer: "The Eiffel Tower" },
        { value: 200, clue: "This ancient amphitheatre in Rome could hold around 50,000 spectators.", answer: "The Colosseum" },
        { value: 300, clue: "Machu Picchu was built by this empire in the 15th century.", answer: "The Inca" },
        { value: 400, clue: "This Indian mausoleum was built by Shah Jahan for his wife Mumtaz Mahal.", answer: "The Taj Mahal" },
        { value: 500, clue: "This prehistoric monument on Salisbury Plain is aligned to the solstice sunrise.", answer: "Stonehenge" },
      ],
    },
    {
      title: "2000s MOVIES",
      clues: [
        { value: 100, clue: "Johnny Depp staggered onto a sinking boat as Jack Sparrow in this 2003 blockbuster.", answer: "Pirates of the Caribbean: The Curse of the Black Pearl" },
        { value: 200, clue: "Heath Ledger's Joker asked Gotham why so serious in this 2008 Batman film.", answer: "The Dark Knight" },
        { value: 300, clue: "Russell Crowe demanded to know 'Are you not entertained?' in this 2000 Ridley Scott epic.", answer: "Gladiator" },
        { value: 400, clue: "This 2001 DreamWorks film about a swamp-dwelling ogre won the first-ever Best Animated Feature Oscar.", answer: "Shrek" },
        { value: 500, clue: "This 2006 Boston crime thriller finally won Martin Scorsese his Best Director Oscar.", answer: "The Departed" },
      ],
    },
    {
      title: "FOOTBALL",
      clues: [
        { value: 100, clue: "This Argentine finally lifted the World Cup in 2022.", answer: "Lionel Messi" },
        { value: 200, clue: "Cristiano Ronaldo's shirt number is also the number in his personal brand.", answer: "7 (CR7)" },
        { value: 300, clue: "The 2022 World Cup was the first ever held in an Arab country — this one.", answer: "Qatar" },
        { value: 400, clue: "Pep Guardiola won the treble with this English club in 2023.", answer: "Manchester City" },
        { value: 500, clue: "This Brazilian is the only player to have won three World Cups.", answer: "Pelé" },
      ],
    },
    {
      title: "IN THE KITCHEN",
      clues: [
        { value: 100, clue: "Chickpeas, tahini, lemon and garlic, blended smooth and finished with olive oil.", answer: "Hummus" },
        { value: 200, clue: "This Italian rice dish is stirred constantly and finished with butter and cheese.", answer: "Risotto" },
        { value: 300, clue: "Japanese for 'grilled over fire', it usually arrives on skewers.", answer: "Yakitori" },
        { value: 400, clue: "This green Mexican sauce gets its colour and tang from tomatillos.", answer: "Salsa verde" },
        { value: 500, clue: "This French mother sauce is milk thickened with a white roux.", answer: "Béchamel" },
      ],
    },
    {
      title: "MUSIC",
      clues: [
        { value: 100, clue: "This Liverpool band released 'Abbey Road' in 1969.", answer: "The Beatles" },
        { value: 200, clue: "Freddie Mercury fronted this band on 'Bohemian Rhapsody'.", answer: "Queen" },
        { value: 300, clue: "This instrument has 88 keys in its modern standard form.", answer: "The piano" },
        { value: 400, clue: "'Rapper's Delight' by the Sugarhill Gang brought this genre to the charts in 1979.", answer: "Hip hop" },
        { value: 500, clue: "This Austrian composer wrote 'The Magic Flute' in the year he died, 1791.", answer: "Mozart" },
      ],
    },
    {
      title: "TECH & TRENDS",
      clues: [
        { value: 100, clue: "This AI company builds Claude.", answer: "Anthropic" },
        { value: 200, clue: "Short vertical videos made this app the most downloaded on earth after 2018.", answer: "TikTok" },
        { value: 300, clue: "Elon Musk renamed this platform with a single letter in 2023.", answer: "X (formerly Twitter)" },
        { value: 400, clue: "This company's first product was the Apple I, sold as a bare circuit board.", answer: "Apple" },
        { value: 500, clue: "This protocol, prefixed to web addresses, was proposed by Tim Berners-Lee.", answer: "HTTP" },
      ],
    },
  ],
};

export const sampleFinalClue: FinalClue = {
  category: "GEOGRAPHY",
  clue: "Of all the world's countries, this one spans the most time zones.",
  answer: "France (via its overseas territories)",
};
