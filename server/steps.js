// Authoritative liturgical content for "Recreate the Mass".
// The order of these steps follows the Order of Mass (USCCB) and the General
// Instruction of the Roman Missal. DO NOT reorder the steps or soften the
// distractors — the wrong cards are deliberately plausible because that is the
// teaching point. Steps flagged `optional: true` may be removed to shorten the
// game; the server reads this flag but keeps all steps by default.

const STEPS = [
  {
    id: "prepare-altar",
    title: "Preparation of the Gifts",
    station: "altar",
    priestAction: "prepares the altar and receives the gifts",
    prompt: "The Liturgy of the Word has just ended. How does the priest begin the Liturgy of the Eucharist?",
    cards: [
      { text: "Prepare the altar and welcome the bread and wine brought forward", correct: true },
      { text: "Proclaim the Gospel reading", correct: false },
      { text: "Give the final blessing and send everyone home", correct: false }
    ],
    explain: "The altar is prepared and the gifts of bread and wine are brought up in the Presentation of the Gifts. The Gospel belongs to the Liturgy of the Word, which is already finished."
  },
  {
    id: "offer-bread",
    title: "Offering the Bread",
    station: "altar",
    priestAction: "lifts the paten and blesses God",
    prompt: "The gifts reach the altar. What does the priest lift up and bless first?",
    cards: [
      { text: "The bread, saying 'Blessed are you, Lord God of all creation'", correct: true },
      { text: "The collection basket of money, holding it up to be adored", correct: false },
      { text: "The Lectionary, to read another passage", correct: false }
    ],
    explain: "The bread is offered first, then the wine. The collection is part of our offering but is never raised up for worship."
  },
  {
    id: "prepare-chalice",
    title: "Preparing the Chalice",
    station: "altar",
    priestAction: "pours wine and a little water into the chalice",
    prompt: "The priest prepares the chalice. What goes into it?",
    cards: [
      { text: "Wine, with a small amount of water added", correct: true },
      { text: "Only water", correct: false },
      { text: "Wine mixed with crumbs of bread", correct: false }
    ],
    explain: "Wine with a little water. The mingling signifies Christ's divinity joined to our humanity."
  },
  {
    id: "lavabo",
    title: "Washing of Hands",
    station: "credence",
    priestAction: "washes his hands at the side of the altar",
    prompt: "Before the great prayer begins, what does the priest do at the side of the altar?",
    cards: [
      { text: "Washes his hands, praying to be cleansed of sin", correct: true },
      { text: "Takes off his vestments", correct: false },
      { text: "Sits down to rest", correct: false }
    ],
    explain: "The Lavabo: 'Wash me, O Lord, from my iniquity.' A sign of the desire for inner purity before the Eucharistic Prayer."
  },
  {
    id: "orate-fratres",
    title: "Invitation to Pray",
    station: "altar",
    priestAction: "invites the people to pray, facing them",
    prompt: "The gifts are ready. How does the priest invite everyone into the sacrifice?",
    cards: [
      { text: "'Pray, brothers and sisters, that my sacrifice and yours may be acceptable to God'", correct: true },
      { text: "'Go in peace'", correct: false },
      { text: "'Let us proclaim the mystery of faith'", correct: false }
    ],
    explain: "The Orate fratres invites the whole assembly to offer the sacrifice together. 'Go in peace' is the dismissal; the mystery of faith comes later, after the consecration."
  },
  {
    id: "preface-dialogue",
    title: "The Eucharistic Prayer Begins",
    station: "altar",
    priestAction: "opens the Eucharistic Prayer",
    prompt: "The Eucharistic Prayer begins. How does the priest open it?",
    cards: [
      { text: "'The Lord be with you... Lift up your hearts... Let us give thanks to the Lord our God'", correct: true },
      { text: "'I confess to almighty God...'", correct: false },
      { text: "'The Mass is ended, go in peace'", correct: false }
    ],
    explain: "The Preface dialogue lifts our hearts into thanksgiving, which is exactly what 'Eucharist' means. The Confiteor belongs near the start of Mass."
  },
  {
    id: "sanctus",
    title: "Holy, Holy, Holy",
    station: "altar",
    priestAction: "leads the whole assembly in the Sanctus",
    prompt: "At the end of the Preface, what does everyone sing together?",
    cards: [
      { text: "'Holy, Holy, Holy Lord God of hosts' (the Sanctus)", correct: true },
      { text: "'Lamb of God, you take away the sins of the world'", correct: false },
      { text: "'Glory to God in the highest' (the Gloria)", correct: false }
    ],
    explain: "The Sanctus joins our voices to the angels in heaven (Isaiah 6:3): 'Hosanna in the highest!' The Lamb of God comes later; the Gloria is near the start of Mass."
  },
  {
    id: "epiclesis",
    title: "Calling the Holy Spirit",
    station: "altar",
    priestAction: "extends his hands over the gifts",
    prompt: "The priest holds his hands out over the bread and wine. What is he doing?",
    cards: [
      { text: "Calling down the Holy Spirit to consecrate the gifts (the Epiclesis)", correct: true },
      { text: "Blessing the congregation goodbye", correct: false },
      { text: "Checking that the bread is fresh", correct: false }
    ],
    explain: "The Epiclesis asks the Father to send the Holy Spirit so the gifts may become the Body and Blood of Christ."
  },
  {
    id: "consecration",
    title: "The Consecration",
    station: "altar",
    priestAction: "speaks Jesus' words over the bread and wine",
    prompt: "The most sacred moment. What words does the priest speak over the bread and wine?",
    cards: [
      { text: "Jesus' own words: 'This is my Body...' and 'This is the chalice of my Blood...'", correct: true },
      { text: "A blessing over the people: 'May almighty God bless you'", correct: false },
      { text: "The Creed: 'I believe in one God...'", correct: false }
    ],
    explain: "This is the Consecration. By Christ's own words, spoken by the priest in the person of Christ, the bread and wine become his Body and Blood. We call this change transubstantiation."
  },
  {
    id: "mystery-of-faith",
    title: "The Mystery of Faith",
    station: "altar",
    priestAction: "elevates the host and chalice, then proclaims the mystery of faith",
    prompt: "Right after the consecration, the priest proclaims...",
    cards: [
      { text: "'The mystery of faith', and the people respond with the Memorial Acclamation", correct: true },
      { text: "'Go in peace'", correct: false },
      { text: "'Let us offer each other the sign of peace'", correct: false }
    ],
    explain: "We proclaim Christ's death and resurrection. The Eucharistic Prayer then closes with the great 'Amen'.",
    optional: true
  },
  {
    id: "our-father",
    title: "The Our Father",
    station: "altar",
    priestAction: "leads the Lord's Prayer",
    prompt: "The Communion Rite begins. Which prayer comes first?",
    cards: [
      { text: "The Our Father (the Lord's Prayer)", correct: true },
      { text: "The Hail Mary", correct: false },
      { text: "The Apostles' Creed", correct: false }
    ],
    explain: "Jesus' own prayer. 'Give us this day our daily bread' even points to the Eucharist we are about to receive."
  },
  {
    id: "sign-of-peace",
    title: "The Sign of Peace",
    station: "altar",
    priestAction: "invites everyone to share Christ's peace",
    prompt: "Before Communion, what does the priest invite everyone to share?",
    cards: [
      { text: "A sign of peace with one another", correct: true },
      { text: "The final blessing", correct: false },
      { text: "A second collection", correct: false }
    ],
    explain: "We share Christ's peace, a sign that we are one community and all children of God."
  },
  {
    id: "fraction",
    title: "The Breaking of the Bread",
    station: "altar",
    priestAction: "breaks the consecrated bread",
    prompt: "What does the priest do as the 'Lamb of God' is sung?",
    cards: [
      { text: "Breaks the consecrated bread (the Fraction)", correct: true },
      { text: "Pours fresh wine into the chalice", correct: false },
      { text: "Reads the day's announcements", correct: false }
    ],
    explain: "The breaking of the bread is the action that gave the earliest Church one of its names for the Eucharist."
  },
  {
    id: "communion",
    title: "Holy Communion",
    station: "aisle",
    priestAction: "gives Communion to the people",
    prompt: "The people come forward. What does the priest say as he gives each person the host?",
    cards: [
      { text: "'The Body of Christ', and the person answers 'Amen'", correct: true },
      { text: "'Peace be with you'", correct: false },
      { text: "'Go in peace, the Mass is ended'", correct: false }
    ],
    explain: "'Amen' means 'I believe' that this truly is the Body of Christ. The Liturgy of the Eucharist is now complete; the Mass closes with the Concluding Rites."
  }
];

module.exports = { STEPS };
