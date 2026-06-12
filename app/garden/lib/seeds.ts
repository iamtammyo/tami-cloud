import type { GardenNote } from "./types";

const PLANTED = "2026-06-12T09:00:00.000Z";

/**
 * Starter plantings so the garden never opens empty. They double as living
 * documentation: the ideas come from the digital-gardening canon (Bernstein,
 * Caufield, Critchlow, Hooks, Appleton) and from how this app itself works.
 * Uproot or rewrite them freely — that is rather the point.
 */
export const SEED_NOTES: GardenNote[] = [
  {
    id: "what-is-a-digital-garden",
    title: "What is a digital garden?",
    body: `A digital garden is a personal patch of the web where ideas are planted before they are ready. It is not a blog. A blog is a stack of finished essays sorted by date; a garden is a landscape of evolving notes sorted by meaning.

> A garden is a collection of evolving ideas that aren't strictly organised by their publication date. They're inherently exploratory — notes are linked through contextual associations. They aren't refined or complete — notes are published as half-finished thoughts that will grow and evolve over time.

That is Maggie Appleton, whose *A Brief History & Ethos of the Digital Garden* traces the idea from Mark Bernstein's 1998 essay *Hypertext Gardens* through to the note-taking renaissance of the 2020s. The word kept resurfacing because people kept needing it: a name for a website that is less performative than a blog and more deliberate than a feed.

Two habits make a garden a garden. It favours [[Topography over timelines]], and it asks you to be comfortable [[Learning in public]]. Everything else — the tools, the templates, the visual dressing — is mulch. See [[The garden and the stream]] for where the metaphor got its teeth, and [[Tending: how this garden works]] for how to work this one.`,
    topics: ["gardening the web"],
    stage: "evergreen",
    plantedAt: PLANTED,
    tendedAt: PLANTED,
  },
  {
    id: "the-garden-and-the-stream",
    title: "The garden and the stream",
    body: `In 2015 Mike Caufield gave a keynote called *The Garden and the Stream: a Technopastoral*, and the modern idea of digital gardening more or less begins there.

The stream is the feed: email, group chats, every timeline you have ever thumbed past. Streams are single-track and time-bound — they surface whatever happened in the last 24 hours, then wash it away. They are good at immediacy and terrible at accumulation. Nothing in a stream matures.

> The Garden is the web as topology. The web as space. It's the integrative web, the iterative web, the web as an arrangement and rearrangement of things to one another.

The garden is the counterbalance: a richly linked landscape that grows slowly, where you choose which curiosity trail to follow instead of accepting the algorithm's. Tom Critchlow later added a third place to the map — *campfires*, the cozy semi-private spaces where half-formed ideas get talked through before they are planted.

A garden does not replace the stream. It is where you carry the few things worth keeping out of it. Related: [[What is a digital garden?]], [[Topography over timelines]].`,
    topics: ["gardening the web", "attention"],
    stage: "budding",
    plantedAt: PLANTED,
    tendedAt: PLANTED,
  },
  {
    id: "topography-over-timelines",
    title: "Topography over timelines",
    body: `The structural break a garden makes with a blog: notes are connected by what they are about, not by when they were written. Dates still exist — every planting here shows when it was planted and last tended — but they are metadata, not architecture.

Instead of a reverse-chronological feed, a garden offers *many entry points and no prescribed pathways*. You wander in anywhere and follow associative links between notes. The richer the linking, the more the garden rewards exploration — which is why bi-directional links matter. When this note links to another, the other note quietly gains a path back; look for the *paths that lead here* section at the foot of every planting.

The old hypertext crowd called the underlying tension *the navigation problem*: how much signposting do you give a wanderer before exploration becomes a guided tour? Mark Bernstein, 1998:

> Unplanned hypertext sprawl is wilderness: complex and interesting, but uninviting. Interesting things await us in the thickets, but we may be reluctant to plough through the brush.

So: link generously, but also tend the beds. Topics gather related plantings the way borders gather perennials. See [[Six patterns of gardening]].`,
    topics: ["gardening the web", "patterns"],
    stage: "budding",
    plantedAt: PLANTED,
    tendedAt: PLANTED,
  },
  {
    id: "learning-in-public",
    title: "Learning in public",
    body: `Gardens are imperfect by design. Publishing a half-grown thought feels wrong because we have been trained to behave — in Appleton's phrase — like *tiny, performative corporations* online: polished posts, settled opinions, personal brands.

A garden refuses the performance, but it owes the reader honesty in exchange. If you publish unfinished thinking, you must say how unfinished it is. That is what the growth stages on every planting are for:

- ✧ *Seedling* — a fresh thought, barely rooted. Expect it to be wrong in places.
- ❀ *Budding* — taking shape, still tender. Some homework has been done.
- ❦ *Evergreen* — settled and pruned. Worth returning to, still never final.

Shawn Wang's *Digital Gardening Terms of Service* frames the contract nicely: the gardener gets room to be wrong and to revise; the reader gets epistemic disclosure and a fair hearing for constructive criticism.

The reward for all this exposure is that the thinking happens in the open, where it can collect evidence, counter-arguments and companions — instead of in a drawer, where it collects nothing.`,
    topics: ["patterns", "practice"],
    stage: "seedling",
    plantedAt: PLANTED,
    tendedAt: PLANTED,
  },
  {
    id: "six-patterns-of-gardening",
    title: "Six patterns of gardening",
    body: `Maggie Appleton, after surveying the gardens that sprang up through 2019–2020, distilled the practice into six recurring patterns — a small pattern language for the genre:

- **Topography over timelines** — organise by association, not publication date. See [[Topography over timelines]].
- **Continuous growth** — nothing is ever finished; notes are revised, expanded, contracted. Planted and tended dates make the growth visible.
- **Imperfection & learning in public** — publish seedlings, mark their maturity honestly. See [[Learning in public]].
- **Playful, personal & experimental** — a garden should be as particular as its gardener. No two should look alike.
- **Intercropping & content diversity** — words, images, quotes, sketches and clippings all belong in the same beds. Monocropping starves a garden.
- **Independent ownership** — the garden lives on ground you control, in formats you can carry away. No platform decides its fate.

This garden tries to honour all six — the last one via *take cuttings*, which hands you everything as plain Markdown or JSON whenever you like. See [[Tending: how this garden works]].`,
    topics: ["patterns"],
    stage: "evergreen",
    plantedAt: PLANTED,
    tendedAt: PLANTED,
  },
  {
    id: "tending-how-this-garden-works",
    title: "Tending: how this garden works",
    body: `A field guide to this particular plot.

## Planting
Press *plant a thought* and write. Plain text is fine; a little markup goes further — *asterisks for italics*, **double for bold**, lines beginning with a > for quotations, dashes for lists, ## for headings.

## Linking
Wrap a title in double brackets to link plantings together: [[Six patterns of gardening]]. If you link to something that does not exist yet, the link turns pale — click it and the garden will offer to plant it for you. Links are matched by title, so if you rename a planting, revisit the notes that pointed at it.

## Growing
Every planting carries a stage — seedling, budding or evergreen — and two dates: when it was planted and when it was last tended. Editing a note tends it. Change the stage as the idea firms up; see [[Learning in public]] for why the honesty matters.

## Wandering
The *wander* button opens a planting at random. Topics group related notes into beds; the search bar cuts across everything.

## Ownership
The garden lives entirely in this browser's local storage — nothing is sent anywhere. Use *take cuttings* to export the whole garden as Markdown or JSON, and do it often: a garden you cannot carry away is somebody else's garden.`,
    topics: ["meta"],
    stage: "evergreen",
    plantedAt: PLANTED,
    tendedAt: PLANTED,
  },
  {
    id: "why-this-garden-reads-like-a-magazine",
    title: "Why this garden reads like a magazine",
    body: `Most digital gardens dress like developer wikis — monospace, dark mode, graph views. This one dresses like a literary magazine on purpose: parchment paper, garamond serifs, small caps, drop caps, fig-ink accents and the occasional fleuron.

The look borrows from *The Fig Tree Magazine* and its school of dreamy editorial design — publications that treat a page of writing as something set, not just rendered. The wager is that ideas grow differently in a beautiful room: if a seedling note looks like it belongs in print, it gets taken seriously enough to be tended.

It is also a nod to the gardening ethos itself. Appleton's fourth pattern says gardens should be *playful, personal and experimental* — a pushback against the bland ocean of identical templates. A garden that looks like everyone else's garden has already conceded something.`,
    topics: ["meta", "design"],
    stage: "seedling",
    plantedAt: PLANTED,
    tendedAt: PLANTED,
  },
];
