/* =====================================================================
   PORTFOLIO CONTENT — single source of truth.
   Every word, image and link on the public site comes from here.
   The admin console edits a copy of this object (saved in the browser)
   and can export it back out as content.json.
   ===================================================================== */
window.PORTFOLIO_DEFAULT = {
  meta: { schema: 1, updatedAt: "2026-11-24T00:00:00Z" },

  site: {
    title: "ArunKumar Mohanan — Actor · Director · Anchor",
    description: "Cinematic portfolio of ArunKumar Mohanan — LV Prasad Film Institute trained actor, director and bilingual event anchor based in Chennai.",
    ogImage: "assets/img/hero.webp",
    accent: "#d4a54a",
    grain: true,
    letterbox: true,
    defaultLens: "all"
  },

  profile: {
    firstName: "ArunKumar",
    lastName: "Mohanan",
    monogram: "AM",
    roles: ["Actor", "Director", "Anchor", "Storyteller"],
    heroLine: "Some people find cinema. Cinema found me.",
    heroImage: "assets/img/hero.webp",
    headshot: "assets/img/headshot.webp",
    showreel: { youtube: "kTrr4SzMshs", label: "Watch the reel", isDedicatedReel: false },
    bioLead: "I am ArunKumar Mohanan — an actor and director who believes the most powerful stories are the ones that leave you breathless and changed.",
    bio: [
      "Trained in both acting and direction at the LV Prasad Film Institute, I bring a dual perspective to every project — understanding the craft from both sides of the lens.",
      "My debut short film “Expectation” reached over 5.7 million viewers and was selected for the Chennai Short Film Festival, proving that authentic stories find their audience.",
      "Rooted in South Indian cinema's tradition of emotional storytelling, I chase characters that live in the grey — conflicted, raw and deeply human. Whether performing or directing, the purpose is the same: make the audience feel something they cannot forget."
    ],
    quote: "Cinema is not what you see. It is what you feel long after the screen goes dark.",
    birthYear: 1998,
    playingRange: "23–29"
  },

  statSheet: [
    { label: "Height", value: "170 cm", note: "5′7″" },
    { label: "Weight", value: "70 kg", note: "" },
    { label: "Build", value: "Medium", note: "" },
    { label: "Eyes", value: "Black", note: "" },
    { label: "Hair", value: "Black", note: "" },
    { label: "Skin tone", value: "Wheatish", note: "" },
    { label: "Languages", value: "Tamil, English", note: "Native · Fluent" },
    { label: "Based in", value: "Chennai, India", note: "" },
    { label: "Training", value: "LV Prasad Film Institute", note: "Acting & Direction" },
    { label: "Available for", value: "Local · Pan-India · International", note: "Travel-ready" }
  ],

  skills: [
    { group: "Acting", items: ["Method Acting", "Improvisation", "Classical Theatre", "Comedy", "Dubbing"] },
    { group: "Movement", items: ["Contemporary Dance", "Stage Combat", "Martial Arts", "Swimming"] },
    { group: "Direction", items: ["Screenwriting", "Cinematography", "Editing"] },
    { group: "Other", items: ["Driving", "Bilingual hosting (Tamil / English)"] }
  ],

  availability: { status: "available", note: "Open for films, ads, web series, theatre and live events" },

  contact: {
    email: "arunaaron85@gmail.com",
    phone: "+91 94862 76429",
    whatsapp: "919486276429",
    instagram: "the_arun_ak",
    formEndpoint: "",
    formProvider: "web3forms"
  },

  featured: {
    title: "Expectation",
    kicker: "Debut short film · 2017",
    roles: "Writer · Screenplay · Director · Actor · Editor",
    logline: "A single short film. Millions of viewers. One filmmaker doing it all.",
    still: "assets/img/exp-still.webp",
    proofImage: "assets/img/exp-trending.webp",
    videos: [
      { label: "Teaser", youtube: "kTrr4SzMshs" },
      { label: "Full film", youtube: "5OiYmceVgDE" },
      { label: "Bloopers & BTS", youtube: "qk-3mGNma5E" }
    ],
    stats: [
      { value: "5.7M+", label: "Views" },
      { value: "175K", label: "Likes" },
      { value: "80.5K", label: "Shares" },
      { value: "45.6K", label: "Saves" },
      { value: "5.4K", label: "Comments" }
    ],
    statsUrl: "https://www.facebook.com/reel/1311761335592620/",
    badges: [
      "Official selection — Chennai Short Film Festival",
      "#29 Trending on YouTube India · Tamil Short Cuts (182K subscribers)"
    ],
    reactionImages: ["assets/img/react-01.webp", "assets/img/react-02.webp", "assets/img/react-03.webp", "assets/img/comments-01.webp", "assets/img/comments-02.webp"]
  },

  projects: [
    { id: "p-expectation", title: "Expectation", type: "Short film", year: "2017", role: "Writer · Director · Actor · Editor", lens: ["director", "actor"], youtube: "5OiYmceVgDE", image: "assets/img/exp-still.webp", status: "released", visible: true,
      description: "A breakout short that reached 5.7 million viewers. Selected at the Chennai Short Film Festival. Written, directed, acted in and edited single-handedly." },
    { id: "p-am-i-selected", title: "Am I Selected", type: "Short film", year: "2025", role: "Director · Lead Actor", lens: ["director", "actor"], youtube: "", image: "assets/img/bts-03.webp", status: "coming-soon", visible: true,
      description: "A tense, intimate short about the anxiety of auditions and the vulnerability of chasing dreams. Screened at LV Prasad Film Institute." },
    { id: "p-easwari", title: "Easwari Engineering College", type: "Commercial", year: "2024", role: "Director", lens: ["director"], youtube: "sUQ4Y91GWts", image: "", status: "released", visible: true,
      description: "Institutional brand film on campus life, innovation and student energy. Directed the full production from concept to delivery." },
    { id: "p-webseries", title: "YouTube Web Series", type: "Web series", year: "2024", role: "Co-Director", lens: ["director"], youtube: "", image: "", status: "coming-soon", visible: true,
      description: "Co-directed a multi-episode web series — creative vision, blocking and on-set direction across the full season." },
    { id: "p-marakka", title: "MARAKKA", type: "Pilot film", year: "", role: "Assistant Director", lens: ["director"], youtube: "5Sge21XPeBI", image: "", status: "unreleased", visible: true,
      description: "Assistant Director on this pilot. Production was halted, but the rough cut speaks for itself." }
  ],

  gallery: [
    { id: "g1", src: "assets/img/headshot.webp", caption: "Portrait session", category: "Photoshoot" },
    { id: "g2", src: "assets/img/exp-still.webp", caption: "Expectation (2017)", category: "Film still" },
    { id: "g3", src: "", caption: "Am I Selected — lead role still", category: "Film still" },
    { id: "g4", src: "", caption: "Profile headshot (left ¾)", category: "Photoshoot" },
    { id: "g5", src: "", caption: "Full-length shot", category: "Photoshoot" },
    { id: "g6", src: "assets/img/bts-02.webp", caption: "Night shoot — watching the take", category: "Behind the scenes" },
    { id: "g7", src: "assets/img/bts-04.webp", caption: "Studio set — blue wash", category: "Behind the scenes" },
    { id: "g8", src: "", caption: "Character look / transformation", category: "Photoshoot" }
  ],

  bts: {
    title: "Am I Selected · Behind the scenes",
    text: "From the director's monitor to the dolly track — every frame was a labour of love.",
    photos: [
      { src: "assets/img/bts-01.webp", caption: "Director's monitor" },
      { src: "assets/img/bts-03.webp", caption: "Framed in doorway light" },
      { src: "assets/img/bts-05.webp", caption: "Behind the camera" }
    ],
    clips: [
      { src: "assets/video/bts-01.mp4", poster: "assets/img/bts-clip-01.webp", caption: "Shoot day" },
      { src: "assets/video/bts-02.mp4", poster: "assets/img/bts-clip-02.webp", caption: "Monitor check" },
      { src: "assets/video/bts-03.mp4", poster: "assets/img/bts-clip-03.webp", caption: "Camera setup" },
      { src: "assets/video/bts-07.mp4", poster: "assets/img/bts-clip-07.webp", caption: "Blocking the shot" }
    ]
  },

  anchoring: {
    intro: "From college fests to corporate stages — commanding the mic, connecting with crowds and turning every event into an experience.",
    stats: [
      { value: "50+", label: "Events hosted" },
      { value: "2", label: "Languages on stage" },
      { value: "5+", label: "Years on the mic" }
    ],
    events: [
      { src: "assets/img/event-01.webp", title: "Audience connect", category: "Cultural" },
      { src: "assets/img/event-05.webp", title: "Festival stage", category: "Cultural" },
      { src: "assets/img/event-06.webp", title: "Live stage hosting", category: "Corporate" },
      { src: "assets/img/event-03.webp", title: "Crowd engagement", category: "Cultural" },
      { src: "assets/img/event-08.webp", title: "Celebration night", category: "Cultural" },
      { src: "assets/img/event-02.webp", title: "Open-air cultural night", category: "Cultural" },
      { src: "assets/img/event-07.webp", title: "On the floor", category: "Cultural" },
      { src: "assets/img/event-04.webp", title: "One-on-one moments", category: "Cultural" }
    ]
  },

  testimonials: [
    { quote: "Film was superb! Your acting seems real than others. Cinematography was awesome. Music was good, not overlapping the video.", author: "Viewer", source: "Messenger", lens: "actor" },
    { quote: "Your acting was good. It was so real. Voice dubbing also perfect, lip sync was on point.", author: "Viewer", source: "WhatsApp", lens: "actor" },
    { quote: "Such a realistic and reality exposed by Director and actors. Your team highlighted my feelings hundred percent.", author: "Jayachandra Babu", source: "Facebook", lens: "director" },
    { quote: "Short film nala irunthuchu da. Different idea. 17 mins neat ah pochu.", author: "Viewer", source: "WhatsApp", lens: "director" },
    { quote: "Hats off to the story writer. Awesome. Friends are never to break.", author: "Riya R", source: "Facebook", lens: "director" },
    { quote: "ArunKumar brings an infectious energy to every stage. His ability to read the room and adapt on the fly makes him one of the best anchors we've worked with.", author: "Event Organizer", source: "Event", lens: "anchor" }
  ],

  timeline: [
    { year: "2025", category: "Film", title: "Am I Selected", role: "Lead Actor & Director", note: "Screened at LV Prasad Film Institute" },
    { year: "2025", category: "Training", title: "LV Prasad Film Institute", role: "Full course — Acting & Direction", note: "" },
    { year: "2024", category: "Web series", title: "YouTube Web Series", role: "Co-Director", note: "Full season" },
    { year: "2024", category: "Commercial", title: "Easwari Engineering College", role: "Director", note: "Institutional ad film" },
    { year: "—", category: "Pilot", title: "MARAKKA", role: "Assistant Director", note: "Unreleased" },
    { year: "2017", category: "Film", title: "Expectation", role: "Writer · Director · Actor · Editor", note: "5.7M+ views · Chennai Short Film Festival" }
  ],

  lenses: {
    all:      { label: "Everything",   cta: "Get in touch",      enquiry: "General",            sections: ["featured", "about", "direction", "gallery", "anchoring", "voices", "credits", "contact"] },
    actor:    { label: "Acting",       cta: "Request audition",  enquiry: "Acting role",        sections: ["about", "gallery", "featured", "voices", "credits", "contact"] },
    director: { label: "Direction",    cta: "Pitch a project",   enquiry: "Direction project",  sections: ["featured", "direction", "bts", "voices", "credits", "contact"] },
    anchor:   { label: "Event host",   cta: "Book for an event", enquiry: "Event booking",      sections: ["anchoring", "voices", "about", "contact"] }
  }
};
