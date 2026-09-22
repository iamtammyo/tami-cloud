import type { Folder } from "../types";

export const readme: Folder = {
  slug: "read-me",
  name: "Read me",
  label: "ABOUT",
  blurb: "Who's running this desktop, in three files.",
  view: "list",
  accent: "ink",
  files: [
    {
      slug: "hello",
      title: "Hello, I'm Tami",
      kind: "note",
      date: "2026-09-22",
      summary: "A Nigerian writer and creator running a one-person editorial practice on taste, work, and identity.",
      body: [
        "I write and make things for a living. By day that's content at Buffer: blog posts, social, and the newsletters. On my own time it's this: a publication of one on taste, work, and identity, plus a camera I take everywhere.",
        "I spent my early career picking from whatever menu was placed in front of me. Agency creative strategist, a planned masters in Ireland, a marketing job at a bank. Then I lost my job in April 2020 and saw how narrow that menu actually was. The shift was deciding I wasn't a Nigerian looking for remote work; I was a person looking for a seat I was qualified to earn.",
        "That's the whole thesis here. You can choose your life. Watch me do it.",
      ],
      info: { Based: "Lagos, Nigeria", Works: "Buffer (content)", Shoots: "Whatever is in front of me" },
    },
    {
      slug: "what-i-do",
      title: "What I actually do",
      kind: "note",
      date: "2026-09-22",
      summary: "Writing, social, newsletters, photography, and the occasional paid partnership.",
      body: [
        "Long-form: blog posts and guides at Buffer, client writing outside it, and a Substack under my own name.",
        "Short-form: LinkedIn and Instagram, where I post in real time about building a creator practice without pretending the playing field is even.",
        "Photography: moody, low light, mostly Lagos. It started as a hobby and is slowly becoming a second craft.",
        "Brand work: I take on a small number of paid partnerships with tools I already use. The Work with me folder has the details.",
      ],
    },
    {
      slug: "disclosure",
      title: "On Buffer",
      kind: "note",
      date: "2026-09-22",
      summary: "Yes, I work there. I'd use it anyway.",
      body: [
        "Some of the stats on this site come straight from Buffer's API, because that's where my channels live. I work at Buffer. I'd use it anyway.",
        "When I talk about tools, sponsored or not, I show them in use. If I don't use it, I don't take the deal.",
      ],
    },
  ],
};
