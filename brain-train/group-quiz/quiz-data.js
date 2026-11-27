"use strict";

(function (root) {
  const flagBangladesh = `<svg viewBox="0 0 120 72" role="img" aria-label="Flag to identify"><rect width="120" height="72" fill="#006a4e"/><circle cx="54" cy="36" r="22" fill="#f42a41"/></svg>`;
  const flagVietnam = `<svg viewBox="0 0 120 72" role="img" aria-label="Flag to identify"><rect width="120" height="72" fill="#da251d"/><path d="M60 12 L65.3 28.4 L82.5 28.4 L68.6 38.5 L73.9 54.9 L60 44.8 L46.1 54.9 L51.4 38.5 L37.5 28.4 L54.7 28.4 Z" fill="#ff0"/></svg>`;
  const choice = (category, prompt, options, correct, extra = {}) =>
    ({ category, prompt, options, correct: Array.isArray(correct) ? correct : [correct], type: "choice", ...extra });
  const person = (image, first, full) => ({
    category: "Picture round", type: "person", image,
    prompt: "Who is the person in this picture?", first, full,
  });
  const film = (image, options, correct) => choice(
    "Picture round", "Which film or TV classic is this picture based on?", options, correct, { image });

  const legacyQuestions = [
    choice("Geography", "What is the capital of Kazakhstan?", ["Astana", "Almaty", "Bishkek", "Tashkent"], "Astana"),
    choice("Christmas", "In which town was Jesus born, according to the Gospel of Luke?", ["Nazareth", "Bethlehem", "Jerusalem", "Jericho"], "Bethlehem"),
    choice("Science", "Which element has the chemical symbol W?", ["Tungsten", "Titanium", "Tin", "Zinc"], "Tungsten"),
    choice("History", "In which year did Constantinople fall to the Ottoman Empire?", ["1453", "1204", "1492", "1529"], "1453"),
    choice("Geography", "Which country does this flag belong to?", ["Bangladesh", "Pakistan", "Palau", "Maldives"], "Bangladesh", { graphic: flagBangladesh }),
    person("images/picture-1.png", "Helene", "Helene Tørlen Lønvik"),
    film("images/picture-1.png", ["Dinner for One", "Christmas Table in Trondheim", "The Butler's Christmas Party", "A Royal Dinner in Oslo"], "Dinner for One"),
    choice("Math", "A price of 640 increases by 15%. What is the new price?", ["736", "704", "740", "754"], "736"),
    choice("Nature", "Which of these is the largest living species of penguin?", ["Emperor penguin", "King penguin", "Gentoo penguin", "Adélie penguin"], "Emperor penguin"),
    choice("Christmas", "Which country donated the Christmas tree in London's Trafalgar Square in 2025?", ["Norway", "Sweden", "Denmark", "Finland"], "Norway"),
    choice("History", "Who was the first emperor of Rome?", ["Augustus", "Julius Caesar", "Nero", "Constantine"], "Augustus"),
    choice("Geography", "Which river flows through Budapest?", ["Danube", "Rhine", "Volga", "Elbe"], "Danube"),
    person("images/picture-2.png", "Torgeir", "Torgeir Ladstein Waagbø"),
    film("images/picture-2.png", ["Home Alone", "Alone Home", "Thailand Is Home", "Alone in Thailand"], "Home Alone"),
    choice("Science", "What is the approximate average distance from Earth to the Moon?", ["384,000 km", "38,400 km", "192,000 km", "1,500,000 km"], "384,000 km"),
    choice("Culture", "Who composed The Four Seasons?", ["Antonio Vivaldi", "Johann Sebastian Bach", "Wolfgang Amadeus Mozart", "George Frideric Handel"], "Antonio Vivaldi"),
    choice("Christmas", "In the song 'The Twelve Days of Christmas', what is given on the fifth day?", ["Five gold rings", "Five calling birds", "Five French hens", "Five turtle doves"], "Five gold rings"),
    choice("Geography", "Which country does this flag belong to?", ["Vietnam", "Morocco", "China", "Turkey"], "Vietnam", { graphic: flagVietnam }),
    choice("Math", "What is 17.5% of 240?", ["42", "36", "40", "48"], "42"),
    person("images/picture-3.png", "Kirsty", "Kirsty Alexa Lewis"),
    film("images/picture-3.png", ["Kirsty in Scotland", "The True Heir of the UK", "Three Wishes for Cinderella", "Tre nøtter til Askepott"], ["Three Wishes for Cinderella", "Tre nøtter til Askepott"]),
    choice("Nature", "What is the largest living marsupial?", ["Red kangaroo", "Koala", "Common wombat", "Tasmanian devil"], "Red kangaroo"),
    choice("Geography", "Which country contains the Okavango Delta?", ["Botswana", "Namibia", "Zimbabwe", "Zambia"], "Botswana"),
    choice("History", "Which treaty formally ended World War I between Germany and the Allied Powers?", ["Treaty of Versailles", "Treaty of Trianon", "Treaty of Lausanne", "Treaty of Brest-Litovsk"], "Treaty of Versailles"),
    choice("Christmas", "Which author wrote A Christmas Carol?", ["Charles Dickens", "Oscar Wilde", "Jane Austen", "Arthur Conan Doyle"], "Charles Dickens"),
    choice("Sport", "What is the standard marathon distance?", ["42.195 km", "40 km", "41.195 km", "42 km"], "42.195 km"),
    person("images/picture-4.png", "Gunnar", "Gunnar Skålheim"),
    film("images/picture-4.png", ["The Grinch", "Gunnar in Suldal", "Christmas Shrek", "The Hulk: Christmas Edition"], "The Grinch"),
    choice("Science", "Which planet has the highest average surface temperature?", ["Venus", "Mercury", "Mars", "Jupiter"], "Venus"),
    choice("Christmas", "What is the name of the Grinch's dog?", ["Max", "Rudolph", "Buddy", "Sam"], "Max"),
  ];

  // Frozen first edition keeps previously stored results aligned to their original questions.
  const secondQuestions = legacyQuestions.slice();
  secondQuestions[2] = choice("News", "In November 2026, which celebrity chef was announced as a host of the returning TV show Top Gear?",
    ["Gordon Ramsay", "Jamie Oliver", "Nigella Lawson", "Heston Blumenthal"], "Gordon Ramsay");
  secondQuestions[15] = choice("News", "Which Hollywood actors settled a legal battle over a French winery in November 2026?",
    ["Angelina Jolie and Brad Pitt", "Ryan Reynolds and Blake Lively", "Nicole Kidman and Tom Cruise", "Jennifer Lopez and Ben Affleck"], "Angelina Jolie and Brad Pitt");
  secondQuestions[22] = choice("News", "In November 2026, BBC Radio 1 announced its 2027 Big Weekend festival would be held in which English city?",
    ["Brighton", "Liverpool", "Bristol", "Newcastle"], "Brighton");

  const thirdQuestions = secondQuestions.slice();
  thirdQuestions[0] = { category: "Geography", type: "map", prompt: "Find Kazakhstan on the map.", correct: ["kz"] };
  thirdQuestions[2] = choice("News from Norway", "In November 2026, Norway's women's handball team beat which team 41–23 in Stjørdal?",
    ["Faroe Islands", "Denmark", "Sweden", "Iceland"], "Faroe Islands");
  thirdQuestions[15] = choice("News from Norway", "In November 2026, which building was voted Norway's ugliest new building by Arkitekturopprøret?",
    ["The D block in the new government quarter", "The Munch Museum", "Oslo Opera House", "The National Museum"], "The D block in the new government quarter");
  thirdQuestions[21] = choice("Christmas", "What is the name of the reindeer with the red nose?",
    ["Rudolph", "Dasher", "Comet", "Blitzen"], "Rudolph");
  thirdQuestions[22] = choice("News from Norway", "In November 2026, a bus fire closed which major road through northern Norway for several days?",
    ["E6", "E18", "E39", "E134"], "E6");
  thirdQuestions[23] = choice("History", "Which wall fell in 1989, becoming a symbol of the end of the Cold War?",
    ["Berlin Wall", "Hadrian's Wall", "Great Wall of China", "Western Wall"], "Berlin Wall");
  thirdQuestions[6] = film("images/picture-1.png", ["Dinner for One / Grevinnen og hovmesteren", "Christmas Table in Trondheim", "The Butler's Christmas Party", "A Royal Dinner in Oslo"], "Dinner for One / Grevinnen og hovmesteren");

  const questions = thirdQuestions.slice();
  questions[2] = choice("News from Norway", "For the Fornebubanen metro project, what were the reported early estimate in 2013 and the external forecast in November 2026?",
    ["NOK 4.5 billion and NOK 34.8 billion", "NOK 8 billion and NOK 20 billion",
      "NOK 12 billion and NOK 25 billion", "NOK 20 billion and NOK 40 billion"],
    "NOK 4.5 billion and NOK 34.8 billion",
    { note: "The early estimate excluded stations and a depot. The figures are nominal and cover different scopes; the 2026 figure is a forecast, not the final cost." });
  questions[15] = choice("News from Norway", "In November 2026, Norway recalled 11 imported varieties of which energy drink?",
    ["Monster Energy", "Red Bull", "Burn", "Battery"], "Monster Energy");
  questions[25] = choice("Math", "Fornebubanen: comparing NOK 4.5 billion in 2013 with the NOK 34.8 billion forecast in 2026, what is the approximate percentage increase?",
    ["673%", "573%", "773%", "87%"], "673%",
    { note: "(34.8 − 4.5) / 4.5 × 100 ≈ 673%. This is a nominal comparison, not an inflation-adjusted or like-for-like project overrun: the early estimate excluded stations and a depot." });

  function normalizeName(value) {
    return String(value).normalize("NFKC").trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
  }
  function isCorrect(question, value) {
    if (question.type === "person") {
      const input = normalizeName(value);
      const first = normalizeName(question.first);
      return input === first || input.startsWith(first + " ");
    }
    return question.correct.includes(value);
  }
  function points(correct, elapsedMs) {
    if (!correct) return 0;
    return 100 + Math.round(50 * Math.max(0, 1 - Math.max(0, elapsedMs) / 30000));
  }
  const api = { questions, thirdQuestions, secondQuestions, legacyQuestions, isCorrect, points };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ChristmasQuiz = api;
})(globalThis);
