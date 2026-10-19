// web/src/lib/pages.ts
import { CONTACT_EMAIL, SITE_NAME } from "./format";

export const INFO_SLUGS = ["about", "methodology", "corrections", "sources", "contact", "privacy", "terms"];
const DRAFT = "DRAFT: this page is a placeholder. Replace it with text reviewed for your actual deployment, data practices and applicable law (including Ghanaian law) before public launch.";

export const PAGES: Record<string, { title: string; paragraphs: string[] }> = {
  about: { title: "About", paragraphs: [
    `${SITE_NAME} is an automated curation service for AI and technology news, with attention to Ghana and the wider African technology ecosystem.`,
    "It finds stories from a list of approved sources, groups reports about the same event, and writes short AI-generated summaries that link back to the original reporting. It does not do original reporting and is not a substitute for reading the sources.",
  ] },
  methodology: { title: "Methodology and AI disclosure", paragraphs: [
    "Sources are chosen and approved manually, using only access methods the publishers permit (feeds and APIs). The system checks them about every two hours. That is a collection target, not a promise that every story appears within two hours.",
    "Summaries are written by an AI model using only the retrieved source material. Software then checks that quotes and numbers appear in the sources. Stories are reviewed by a person before publication. These checks reduce errors but cannot guarantee a summary is accurate, so always consult the linked sources.",
    "Where only a headline and short excerpt were accessible, the story is marked as a limited entry. Labels such as “Reports differ” and “Single-source report” describe the evidence we have, not an absolute guarantee of truth. Several outlets repeating one report are not counted as independent confirmation.",
    "Related reports of the same event are grouped into one story. Meaningful new developments become separate, linked follow-up stories.",
  ] },
  corrections: { title: "Corrections policy", paragraphs: [
    `To report an error or a broken link, email ${CONTACT_EMAIL || "the contact address on the Contact page"}.`,
    "Material corrections and updates are shown on the story page with the date and a short explanation. The earlier version is kept in our internal history. A story that is retracted at its source is unpublished or replaced with a withdrawal notice.",
    "Publishers and rights holders who want content reviewed or removed can contact us at the same address.",
  ] },
  contact: { title: "Contact", paragraphs: [CONTACT_EMAIL ? `Email: ${CONTACT_EMAIL}` : "Add a contact address in NEXT_PUBLIC_CONTACT_EMAIL."] },
  privacy: { title: "Privacy policy", paragraphs: [DRAFT, "Readers do not need an account. Describe here exactly what is collected (for example server logs and any analytics you enable), why, how long it is kept, and how to contact you about it."] },
  terms: { title: "Terms of use", paragraphs: [DRAFT, "Describe the use of the site, that summaries are AI-generated, and the ownership of linked content, which stays with its publishers."] },
};