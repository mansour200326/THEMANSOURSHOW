import {
  type Prompt,
  type RoundState,
  type VoteOption,
  createRoundGame,
  shuffle,
  tally,
} from "@/lib/games/roundEngine";
import { type Room, connectedPlayers } from "@/lib/room/types";

/* ------------------------------------------------------------ content packs */

const MOST_LIKELY_TO: Prompt[] = [
  { text: "Most likely to text 'omw' from the shower" },
  { text: "Most likely to cry at an advert" },
  { text: "Most likely to start a business and abandon it in a week" },
  { text: "Most likely to fall asleep at their own party" },
  { text: "Most likely to argue with a GPS" },
  { text: "Most likely to adopt a stray on holiday" },
  { text: "Most likely to be late to their own wedding" },
  { text: "Most likely to win an argument they were wrong about" },
  { text: "Most likely to eat something off the floor" },
  { text: "Most likely to become a reality TV villain" },
  { text: "Most likely to forget where they parked" },
  { text: "Most likely to reply to a group chat three days later" },
  { text: "Most likely to befriend the taxi driver" },
  { text: "Most likely to order for the whole table" },
  { text: "Most likely to have a secret second phone" },
  { text: "Most likely to get banned from a restaurant" },
  { text: "Most likely to survive a zombie film" },
  { text: "Most likely to be the last one still dancing" },
  { text: "Most likely to give a speech nobody asked for" },
  { text: "Most likely to buy something at 3am and regret it" },
  { text: "Most likely to lose their passport abroad" },
  { text: "Most likely to become a cult leader" },
  { text: "Most likely to cheat at a board game" },
  { text: "Most likely to keep a plant alive for a year" },
  { text: "Most likely to end up on the news" },
  { text: "Most likely to move countries without telling anyone" },
  { text: "Most likely to get lost in their own neighbourhood" },
  { text: "Most likely to become suspiciously rich overnight" },
  { text: "Most likely to start an argument and never let it go" },
  { text: "Most likely to be late to their own wedding" },
  { text: "Most likely to survive a week alone in the wild" },
  { text: "Most likely to spend a month's rent on something ridiculous" },
  { text: "Most likely to fall asleep during the film" },
  { text: "Most likely to text their ex at 2am" },
  { text: "Most likely to become a driving instructor and be terrible at it" },
  { text: "Most likely to get famous for something embarrassing" },
  { text: "Most likely to still be in this group chat in 30 years" },
  { text: "Most likely to order the most expensive thing on the menu" },
  { text: "Most likely to cry at a cartoon" },
  { text: "Most likely to fight a seagull and lose" },
];

const GUESS_WHO: Prompt[] = [
  { text: "What's the worst piece of advice you've ever taken?" },
  { text: "Describe your perfect Friday in five words." },
  { text: "What's something you're weirdly good at?" },
  { text: "What's the pettiest reason you've held a grudge?" },
  { text: "If you had to leave the country tonight, where would you go?" },
  { text: "What's your most controversial food opinion?" },
  { text: "What would your autobiography be called?" },
  { text: "What's the last thing you Googled?" },
  { text: "Name a rule you break constantly." },
  { text: "What's the worst haircut you've ever had?" },
];

/* -------------------------------------------------------------- 1. Most Likely To */

const playersAsOptions = (room: Room): VoteOption[] =>
  connectedPlayers(room).map((p) => ({
    id: p.id,
    label: p.name,
    authorId: p.id,
  }));

export const mostLikelyTo = createRoundGame(
  {
    id: "most-likely-to",
    name: "Most Likely To",
    minPlayers: 3,
    collect: null,
    rounds: 8,
    allowSelfVote: true,
    buildOptions: playersAsOptions,
    score: (room, s) => {
      const counts = tally(s.votes);
      const top = Math.max(0, ...Object.values(counts));
      if (top === 0) return {};
      // Everyone tied at the top wears it.
      return Object.fromEntries(
        Object.entries(counts)
          .filter(([, n]) => n === top)
          .map(([id]) => [id, 1000]),
      );
    },
  },
  MOST_LIKELY_TO,
);

/* ---------------------------------------------------------- 2. Who Said It */

export const guessWhoSaidIt = createRoundGame(
  {
    id: "who-said-it",
    name: "Who Said It",
    minPlayers: 3,
    collect: { prompt: "Answer honestly — nobody sees your name", maxLength: 90 },
    rounds: 6,
    allowSelfVote: false,
    // One answer goes up; everyone guesses who wrote it.
    pickFocus: (_room, s) => {
      const ids = Object.keys(s.submissions);
      return ids.length ? ids[Math.floor(Math.random() * ids.length)] : undefined;
    },
    buildOptions: playersAsOptions,
    score: (room, s) => {
      if (!s.focus) return {};
      const points: Record<string, number> = {};
      Object.entries(s.votes).forEach(([voterId, guess]) => {
        if (guess === s.focus) points[voterId] = 1000;
      });
      // Nobody guessed you? You wrote a good one.
      const caught = Object.values(s.votes).filter((g) => g === s.focus).length;
      if (caught === 0) points[s.focus] = (points[s.focus] ?? 0) + 1000;
      return points;
    },
  },
  GUESS_WHO,
);


/* ------------------------------------------------------------ 3. Punchline */

/*
 * The setup goes up, everyone writes the punchline, and the room votes for
 * the best one with no names attached. The bundled setups are open enough
 * that a bad joke is still a joke.
 */
const PUNCHLINE: Prompt[] = [
  { text: "The worst thing to hear from your dentist:" },
  { text: "My therapist finally admitted\u2026" },
  { text: "The one rule at my grandmother's house:" },
  { text: "A vampire walks into a blood bank and asks\u2026" },
  { text: "The real reason the dinosaurs went extinct:" },
  { text: "My gym's new slogan:" },
  { text: "The last thing you want written on a wedding cake:" },
  { text: "The worst possible name for a cruise ship:" },
  { text: "Rejected title for the next James Bond film:" },
  { text: "The pilot came on the speaker and said\u2026" },
  { text: "What the cat is actually thinking at 3am:" },
  { text: "The airline's new policy:" },
  { text: "The one thing you should never say on a first date:" },
  { text: "The least popular ice cream flavour:" },
  { text: "A terrible thing to hear from your surgeon:" },
  { text: "The world's worst superhero, and their power:" },
  { text: "My roommate's excuse for the state of the kitchen:" },
  { text: "The fortune cookie just said\u2026" },
  { text: "The prime minister's secret hobby:" },
  { text: "The most honest slogan for Mondays:" },
  { text: "The real reason the Wi-Fi is down again:" },
  { text: "The worst way to end a speech at a wedding:" },
  { text: "The dog's CV, line one:" },
  { text: "What the museum guard whispers to the paintings:" },
  { text: "A children's book that never got published:" },
  { text: "What the self-checkout machine is really thinking:" },
  { text: "The neighbour's excuse for the noise at 2am:" },
  { text: "The reason aliens haven't visited yet:" },
  { text: "The gift nobody wants for Christmas:" },
  { text: "The pub quiz question nobody got:" },
];

/** Everyone's submission, in a fresh order, with the author kept for the reveal. */
const submissionsAsOptions = (_room: Room, s: RoundState): VoteOption[] =>
  shuffle(
    Object.entries(s.submissions).map(([authorId, label]) => ({
      id: authorId,
      label,
      authorId,
    })),
  );

/**
 * The most-voted line takes a thousand, and so does anyone tied with it.
 * A line that got even one vote takes five hundred: somebody laughed, and
 * that's worth something on a night like this.
 */
const scoreByVotes = (_room: Room, s: RoundState): Record<string, number> => {
  const counts = tally(s.votes);
  const top = Math.max(0, ...Object.values(counts));
  if (top === 0) return {};
  return Object.fromEntries(
    Object.entries(counts).map(([id, n]) => [id, n === top ? 1000 : 500]),
  );
};

export const punchline = createRoundGame(
  {
    id: "punchline",
    name: "Punchline",
    minPlayers: 3,
    collect: { prompt: "Write the punchline", maxLength: 100 },
    rounds: 6,
    allowSelfVote: false,
    buildOptions: submissionsAsOptions,
    score: scoreByVotes,
  },
  PUNCHLINE,
);

/* --------------------------------------------------------- 4. Add a Caption */

/*
 * A picture goes up and everyone captions it. The pictures are real files
 * from Wikimedia Commons with their licence and credit carried along, found
 * the same way Big Board's picture clues are; the bundled ones were looked
 * up once and kept, so the game works with no key and no network to the
 * model. Each carries its subject so a night never gets the same goat twice.
 */
const CAPTION_THIS: Prompt[] = [
  { text: "Caption this", subject: "goat on a roof", image: { url: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Goat_on_the_roof_%282053292754%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "Tim Green from Bradford", licence: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Goat_on_the_roof_(2053292754).jpg" } },
  { text: "Caption this", subject: "dog wearing sunglasses", image: { url: "https://upload.wikimedia.org/wikipedia/commons/6/69/Dog_wearing_sunglasses.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "AAAMER0623", licence: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Dog_wearing_sunglasses.jpg" } },
  { text: "Caption this", subject: "pigeon on head", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/Feral_pigeon_on_cliffside_at_Berry_Head%2C_Devon_2.jpg/1920px-Feral_pigeon_on_cliffside_at_Berry_Head%2C_Devon_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Partonez", licence: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Feral_pigeon_on_cliffside_at_Berry_Head,_Devon_2.jpg" } },
  { text: "Caption this", subject: "raccoon in a bin", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Raccoon_beside_blue_bin.jpg/1920px-Raccoon_beside_blue_bin.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "User:Decius", licence: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Raccoon_beside_blue_bin.jpg" } },
  { text: "Caption this", subject: "cat on a keyboard", image: { url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Cat_keyboard.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "slava", licence: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Cat_keyboard.jpg" } },
  { text: "Caption this", subject: "squirrel eating pizza", image: { url: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Squirrel_on_a_fence_eating_a_slice_of_pizza.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "Tomwsulcer", licence: "CC0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Squirrel_on_a_fence_eating_a_slice_of_pizza.JPG" } },
  { text: "Caption this", subject: "cow on the beach", image: { url: "https://upload.wikimedia.org/wikipedia/commons/8/89/East_Cowes_Beach_-_geograph.org.uk_-_65643.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "Mark Pilbeam", licence: "CC BY-SA 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:East_Cowes_Beach_-_geograph.org.uk_-_65643.jpg" } },
  { text: "Caption this", subject: "duck in a puddle", image: { url: "https://upload.wikimedia.org/wikipedia/commons/5/59/Peter_Rabbit_and_Gemima_Puddle_Duck..jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "Gpmg", licence: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Peter_Rabbit_and_Gemima_Puddle_Duck..jpg" } },
  { text: "Caption this", subject: "monkey with a phone", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Monkey_with_stolen_iPhone_in_Uluwatu.jpg/1920px-Monkey_with_stolen_iPhone_in_Uluwatu.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Ponkipo", licence: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Monkey_with_stolen_iPhone_in_Uluwatu.jpg" } },
  { text: "Caption this", subject: "dog on a skateboard", image: { url: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Skateboarding_dog_%285604208213%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "Ivan Bandura", licence: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Skateboarding_dog_(5604208213).jpg" } },
  { text: "Caption this", subject: "penguin walking", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Adelie_penguin_%28Pygoscelis_adeliae%29%2C_walking.jpg/1920px-Adelie_penguin_%28Pygoscelis_adeliae%29%2C_walking.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Jason Auch", licence: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Adelie_penguin_(Pygoscelis_adeliae),_walking.jpg" } },
  { text: "Caption this", subject: "sloth hanging", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Sloth_Hanging_and_Curious_%2819537184135%29.jpg/1920px-Sloth_Hanging_and_Curious_%2819537184135%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Eric Kilby from Somerville, MA, USA", licence: "CC BY-SA 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Sloth_Hanging_and_Curious_(19537184135).jpg" } },
  { text: "Caption this", subject: "owl staring", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Spotted_Owlet_staring_from_tree_cavity.jpg/1920px-Spotted_Owlet_staring_from_tree_cavity.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Archana96", licence: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Spotted_Owlet_staring_from_tree_cavity.jpg" } },
  { text: "Caption this", subject: "elephant in a swimming pool", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Elephants_swimming_in_a_pool_of_water.jpg/1920px-Elephants_swimming_in_a_pool_of_water.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Awinsongyababa", licence: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Elephants_swimming_in_a_pool_of_water.jpg" } },
  { text: "Caption this", subject: "horse in a car", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Cherrelyn_Horse_Car_horse.jpg/1920px-Cherrelyn_Horse_Car_horse.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Xnatedawgx", licence: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Cherrelyn_Horse_Car_horse.jpg" } },
  { text: "Caption this", subject: "pug in costume", image: { url: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Black_pug_in_cow_costume.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "istolethetv", licence: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Black_pug_in_cow_costume.jpg" } },
  { text: "Caption this", subject: "alpaca smiling", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/Alpaca_as_if_smiling_07082010.jpg/1920px-Alpaca_as_if_smiling_07082010.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Leithian", licence: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Alpaca_as_if_smiling_07082010.jpg" } },
  { text: "Caption this", subject: "bear in hammock", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Bear_in_Hammock.JPG/1920px-Bear_in_Hammock.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Isderion", licence: "CC BY-SA 3.0 de", sourceUrl: "https://commons.wikimedia.org/wiki/File:Bear_in_Hammock.JPG" } },
  { text: "Caption this", subject: "chicken on a bicycle", image: { url: "https://upload.wikimedia.org/wikipedia/commons/7/76/Bicycle_Loaded_with_Chickens_%288395076888%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "Michael Coghlan from Adelaide, Australia", licence: "CC BY-SA 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Bicycle_Loaded_with_Chickens_(8395076888).jpg" } },
  { text: "Caption this", subject: "dog wearing glasses", image: { url: "https://upload.wikimedia.org/wikipedia/commons/3/33/English_bulldog_wearing_headphones_and_glasses%2C_listening_to_the_radio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "Unknown photographer", licence: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:English_bulldog_wearing_headphones_and_glasses,_listening_to_the_radio.jpg" } },
  { text: "Caption this", subject: "hamster eating", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Hamster_eating_food.JPG/1920px-Hamster_eating_food.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "NASCAR Fan24", licence: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Hamster_eating_food.JPG" } },
  { text: "Caption this", subject: "cat in a bag", image: { url: "https://upload.wikimedia.org/wikipedia/commons/6/61/Cat_out_of_the_bag_%28284803429%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "Dwight Sipler from Stow, MA, USA", licence: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Cat_out_of_the_bag_(284803429).jpg" } },
  { text: "Caption this", subject: "fox sleeping", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Sleeping_Fox_%2816135742949%29.jpg/1920px-Sleeping_Fox_%2816135742949%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Anthony Quintano from Honolulu, HI, United States", licence: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Sleeping_Fox_(16135742949).jpg" } },
  { text: "Caption this", subject: "dog in sweater", image: { url: "https://upload.wikimedia.org/wikipedia/commons/4/41/Hot_dog_sweater_1434172037.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "iluvrhinestones from seattle, oceania, upload by Herrick 07:", licence: "CC BY-SA 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Hot_dog_sweater_1434172037.jpg" } },
  { text: "Caption this", subject: "goat in a tree", image: { url: "https://upload.wikimedia.org/wikipedia/commons/6/69/Goats_on_an_Argan_%28Argania_spinosa%29_tree_in_Morocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "marco arcangeli", licence: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Goats_on_an_Argan_(Argania_spinosa)_tree_in_Morocco.jpg" } },
  { text: "Caption this", subject: "panda falling", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Cub_Red_Panda_almost_falling_of.jpg/1920px-Cub_Red_Panda_almost_falling_of.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Jar0d", licence: "CC BY-SA 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Cub_Red_Panda_almost_falling_of.jpg" } },
  { text: "Caption this", subject: "otter holding hands", image: { url: "https://upload.wikimedia.org/wikipedia/commons/5/50/Sea_otters_holding_hands%2C_cropped.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "Joe Robertson from Austin, Texas, USA; cropped version by Pe", licence: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Sea_otters_holding_hands,_cropped.jpg" } },
  { text: "Caption this", subject: "frog on a leaf", image: { url: "https://upload.wikimedia.org/wikipedia/commons/7/76/Frog_on_Leaf_-_geograph.org.uk_-_3565397.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled", credit: "John Illingworth", licence: "CC BY-SA 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Frog_on_Leaf_-_geograph.org.uk_-_3565397.jpg" } },
  { text: "Caption this", subject: "cat yawning", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Tabby_cat-yawning-01.jpg/1920px-Tabby_cat-yawning-01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Hisashi", licence: "CC BY-SA 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Tabby_cat-yawning-01.jpg" } },
  { text: "Caption this", subject: "dog with tongue out", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/German_Shepherd_with_tongue_sticking_out.jpeg/1920px-German_Shepherd_with_tongue_sticking_out.jpeg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Lewis Collard", licence: "Attribution", sourceUrl: "https://commons.wikimedia.org/wiki/File:German_Shepherd_with_tongue_sticking_out.jpeg" } },
  { text: "Caption this", subject: "gorilla thinking", image: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/Gorilla_thinking_on_the_grass.jpg/1920px-Gorilla_thinking_on_the_grass.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", credit: "Joselodos", licence: "CC0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Gorilla_thinking_on_the_grass.jpg" } },
];

export const captionThis = createRoundGame(
  {
    id: "caption-this",
    name: "Add a Caption",
    minPlayers: 3,
    collect: { prompt: "Write the caption", maxLength: 80 },
    rounds: 6,
    allowSelfVote: false,
    buildOptions: submissionsAsOptions,
    score: scoreByVotes,
  },
  CAPTION_THIS,
);

export const roundGamePacks = {
  "most-likely-to": MOST_LIKELY_TO,
  "who-said-it": GUESS_WHO,
  punchline: PUNCHLINE,
  "caption-this": CAPTION_THIS,
};
