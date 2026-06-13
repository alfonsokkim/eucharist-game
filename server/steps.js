// Authoritative liturgical content for "Recreate the Mass".
// The order of these steps follows the Order of Mass (USCCB) and the General
// Instruction of the Roman Missal. DO NOT reorder the steps or soften the
// distractors. Each step also carries a `teach` block (whatHappens / meaning /
// scripture) shown on the reveal so the game teaches, not just quizzes.

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
    explain: "The altar is prepared and the gifts of bread and wine are brought up in the Presentation of the Gifts. The Gospel belongs to the Liturgy of the Word, which is already finished.",
    teach: {
      whatHappens: "The altar is prepared with the corporal, purificator, chalice and Missal. Members of the assembly bring the bread and wine forward, often with the collection for the Church and the poor.",
      meaning: "Our ordinary gifts of bread, wine, and the work of our hands are placed on the altar to be transformed. We offer not just things, but ourselves.",
      scripture: "Psalm 104:14-15: bread and wine as the fruit of the earth and work of human hands."
    }
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
    explain: "The bread is offered first, then the wine. The collection is part of our offering but is never raised up for worship.",
    teach: {
      whatHappens: "The priest raises the paten: 'Blessed are you, Lord God of all creation, for through your goodness we have received the bread we offer you...' All respond: 'Blessed be God for ever.' The wine is offered next in the same way.",
      meaning: "This is a Jewish-style blessing (berakah): we bless God for his gifts before offering them back to him.",
      scripture: "Echoes Jesus at the Last Supper, Luke 22:19."
    }
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
    explain: "Wine with a little water. The mingling signifies Christ's divinity joined to our humanity.",
    teach: {
      whatHappens: "The priest pours wine into the chalice and adds a small drop of water, praying quietly: 'By the mystery of this water and wine may we come to share in the divinity of Christ...'",
      meaning: "The water mingled with the wine signifies our humanity joined to Christ's divinity, and recalls the blood and water that flowed from his pierced side.",
      scripture: "John 19:34: blood and water flowed from Christ's side."
    }
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
    explain: "The Lavabo: 'Wash me, O Lord, from my iniquity.' A sign of the desire for inner purity before the Eucharistic Prayer.",
    teach: {
      whatHappens: "At the side of the altar the priest washes his hands, praying quietly: 'Wash me, O Lord, from my iniquity and cleanse me from my sin.' This is called the Lavabo (Latin for 'I will wash').",
      meaning: "A humble gesture of the desire for interior purity as he prepares to lead the Church's most sacred prayer.",
      scripture: "Psalm 51:2: 'Wash me thoroughly from my iniquity.'"
    }
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
    explain: "The Orate fratres invites the whole assembly to offer the sacrifice together. 'Go in peace' is the dismissal; the mystery of faith comes later, after the consecration.",
    teach: {
      whatHappens: "The priest invites: 'Pray, brethren, that my sacrifice and yours may be acceptable to God, the almighty Father.' The people stand and respond: 'May the Lord accept the sacrifice at your hands, for the praise and glory of his name, for our good and the good of all his holy Church.'",
      meaning: "The whole assembly offers the one sacrifice together with the priest. Notice that it is 'my sacrifice and yours.'",
      scripture: "Romans 12:1: offer your bodies as a living sacrifice."
    }
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
    explain: "The Preface dialogue lifts our hearts into thanksgiving, which is exactly what 'Eucharist' means. The Confiteor belongs near the start of Mass.",
    teach: {
      whatHappens: "The Preface dialogue: 'The Lord be with you.' / 'And with your spirit.' Then 'Lift up your hearts.' / 'We lift them up to the Lord.' Then 'Let us give thanks to the Lord our God.' / 'It is right and just.'",
      meaning: "We lift our hearts and give thanks. The word 'Eucharist' itself means 'thanksgiving.' This opens the Eucharistic Prayer, the centre and high point of the whole Mass.",
      scripture: "Colossians 3:1: seek the things that are above. See also Lamentations 3:41."
    }
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
    explain: "The Sanctus joins our voices to the angels in heaven (Isaiah 6:3): 'Hosanna in the highest!' The Lamb of God comes later; the Gloria is near the start of Mass.",
    teach: {
      whatHappens: "At the end of the Preface all sing: 'Holy, Holy, Holy Lord God of hosts. Heaven and earth are full of your glory. Hosanna in the highest. Blessed is he who comes in the name of the Lord. Hosanna in the highest.'",
      meaning: "Our voices join the angels and saints in heaven's unending worship. 'Blessed is he who comes...' echoes the crowds welcoming Jesus into Jerusalem.",
      scripture: "Isaiah 6:3 (the angels' song); Matthew 21:9 (Palm Sunday)."
    }
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
    explain: "The Epiclesis asks the Father to send the Holy Spirit so the gifts may become the Body and Blood of Christ.",
    teach: {
      whatHappens: "The priest extends his hands over the gifts and asks the Father to send the Holy Spirit: '...by the same Spirit graciously make holy these gifts we have brought to you for consecration, that they may become the Body and Blood of your Son.'",
      meaning: "Epiclesis is Greek for 'calling down upon.' The Church calls on the Holy Spirit, who sanctifies the gifts, the same Spirit at work in the Incarnation.",
      scripture: "Luke 1:35: the Holy Spirit overshadows Mary."
    }
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
    explain: "This is the Consecration. By Christ's own words, spoken by the priest in the person of Christ, the bread and wine become his Body and Blood. We call this change transubstantiation.",
    teach: {
      whatHappens: "Speaking in the person of Christ, the priest repeats Jesus' own words: 'Take this, all of you, and eat of it, for this is my Body, which will be given up for you.' Then over the chalice: 'this is the chalice of my Blood...' He genuflects and elevates the host and the chalice.",
      meaning: "By Christ's words the bread and wine become his true Body and Blood. The substance is changed though the appearances remain. The Church calls this transubstantiation. This is the source and summit of the Mass.",
      scripture: "Luke 22:19-20; 1 Corinthians 11:23-25."
    }
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
    teach: {
      whatHappens: "The priest proclaims 'The mystery of faith,' and the people respond with a Memorial Acclamation, such as: 'We proclaim your Death, O Lord, and profess your Resurrection until you come again.'",
      meaning: "We proclaim the Paschal Mystery: Christ's Death, Resurrection, and promise to return, now made present on the altar.",
      scripture: "1 Corinthians 11:26: 'you proclaim the Lord's death until he comes.'"
    },
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
    explain: "Jesus' own prayer. 'Give us this day our daily bread' even points to the Eucharist we are about to receive.",
    teach: {
      whatHappens: "The Communion Rite begins. The priest invites us, and at the Saviour's command all pray together: 'Our Father, who art in heaven...'",
      meaning: "Jesus' own prayer prepares us to receive him. 'Give us this day our daily bread' looks ahead to the Bread of Life we are about to receive in Communion.",
      scripture: "Matthew 6:9-13; Luke 11:2-4."
    }
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
    explain: "We share Christ's peace, a sign that we are one community and all children of God.",
    teach: {
      whatHappens: "The priest prays for peace and says, 'The peace of the Lord be with you always,' then invites all to offer one another a sign of peace.",
      meaning: "Reconciled and united as one body, we share Christ's peace before approaching the one table together.",
      scripture: "John 20:19: the risen Christ says 'Peace be with you.' See also Matthew 5:23-24."
    }
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
    explain: "The breaking of the bread is the action that gave the earliest Church one of its names for the Eucharist.",
    teach: {
      whatHappens: "As the 'Lamb of God' (Agnus Dei) is sung, the priest breaks the consecrated host and places a small piece into the chalice (the commingling).",
      meaning: "The one bread is broken so that the many may share in it. The earliest Christians called the Eucharist itself 'the breaking of the bread.'",
      scripture: "1 Corinthians 10:17; Acts 2:42; Luke 24:35."
    }
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
    explain: "'Amen' means 'I believe' that this truly is the Body of Christ. The Liturgy of the Eucharist is now complete; the Mass closes with the Concluding Rites.",
    teach: {
      whatHappens: "The priest shows the host: 'Behold the Lamb of God...' and all respond, 'Lord, I am not worthy that you should enter under my roof...' Then, giving Communion, the minister says 'The Body of Christ,' and each person answers 'Amen.'",
      meaning: "'Amen' means 'I believe,' that this truly is the Body of Christ. Receiving worthily, we are united to Christ and to one another. The Liturgy of the Eucharist is now complete; the Mass closes with the Concluding Rites.",
      scripture: "John 6:51-56; 1 Corinthians 11:27-29."
    }
  }
];

module.exports = { STEPS };
