// web/src/lib/pages.ts
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "./format";
const OPERATOR = "Infynexis";
const UPDATED = "21 October 2026";
const EMAIL = CONTACT_EMAIL || "the address on the Contact page";

export const INFO_SLUGS = ["about", "methodology", "corrections", "sources", "contact", "privacy", "terms"];

export const PAGES: Record<string, { title: string; paragraphs: string[] }> = {
  about: {
    title: "About",
    paragraphs: [
      `${SITE_NAME} is an automated curation service for AI and technology news, with attention to Ghana and the wider African technology ecosystem.`,
      "It finds stories from a list of approved sources, groups reports about the same event, and writes short AI-generated summaries that link back to the original reporting. It does not do original reporting and is not a substitute for reading the sources.",
    ],
  },
  methodology: {
    title: "Methodology and AI disclosure",
    paragraphs: [
      "Sources are chosen and approved manually, using only access methods the publishers permit (feeds and APIs). The system checks them about every two hours. That is a collection target, not a promise that every story appears within two hours.",
      "Summaries are written by an AI model using only the retrieved source material. Software then checks that quotes and numbers appear in the sources. Stories are reviewed by a person before publication. These checks reduce errors but cannot guarantee a summary is accurate, so always consult the linked sources.",
      "Where only a headline and short excerpt were accessible, the story is marked as a limited entry. Labels such as “Reports differ” and “Single-source report” describe the evidence we have, not an absolute guarantee of truth. Several outlets repeating one report are not counted as independent confirmation.",
      "Related reports of the same event are grouped into one story. Meaningful new developments become separate, linked follow-up stories.",
    ],
  },
  corrections: {
    title: "Corrections policy",
    paragraphs: [
      `To report an error or a broken link, email ${CONTACT_EMAIL || "the contact address on the Contact page"}.`,
      "Material corrections and updates are shown on the story page with the date and a short explanation. The earlier version is kept in our internal history. A story that is retracted at its source is unpublished or replaced with a withdrawal notice.",
      "Publishers and rights holders who want content reviewed or removed can contact us at the same address.",
    ],
  },
  contact: {
    title: "Contact",
    paragraphs: [
      CONTACT_EMAIL ? `Email: ${CONTACT_EMAIL}` : "Add a contact address in NEXT_PUBLIC_CONTACT_EMAIL.",
    ],
  },
  privacy: {
    title: "Privacy policy",
    paragraphs: [
      `Last updated: ${UPDATED}`,
      `This policy explains what personal data ${SITE_NAME} (${SITE_URL}) handles, why, and your rights. The site is operated by ${OPERATOR} in Ghana, who is the data controller.`,
      "## 1. The short version",
      "You do not need an account to read this site. We do not run advertising, we do not sell personal data, and we do not use tracking cookies or analytics tools.",
      "## 2. Data we handle",
      "Server logs. Our hosting provider automatically records technical data when you visit, such as your IP address, browser type, the pages requested and the time. This is used to deliver the site, keep it secure and diagnose faults.",
      "Rate limiting. Search and administrator sign-in requests are limited by IP address to prevent abuse. This is held temporarily in server memory and is not stored in our database.",
      "Search. If you use the search page, your search words are sent to our server to produce results. We do not use them to identify you.",
      "Messages. If you email us (for example to report a correction), we receive your email address and message, and we keep them as long as needed to handle your request.",
      "Cookies. The public site does not set cookies for visitors. Cookies are used only for the sign-in session of authorised administrators.",
      "Administrators. For the small number of people who run the site, we store account details (email and role) and a record of actions taken in the admin area, for security and accountability.",
      "## 3. Why we use data",
      "To operate and secure the site, to respond to messages and correction requests, and to keep a record of editorial actions. Our legal basis is our legitimate interest in running a safe, working service, and your consent where you contact us.",
      "## 4. Service providers",
      "These providers help us run the site and process data on our behalf:",
      "- Vercel hosts the website and records server logs.",
      "- Supabase hosts our database (servers in the European Union, Ireland).",
      "- GitHub runs our automated collection of news items.",
      "- An AI provider (Groq) processes the text of news items to draft summaries. No visitor data is sent to it.",
      "- An email service delivers operational alerts to the site owner.",
      "Some providers operate outside Ghana, so data may be processed in other countries. We choose providers with appropriate security practices.",
      "## 5. How long we keep data",
      "Server logs are kept by our hosting provider for the period set by their service. Emails are kept only as long as needed to handle your request and for a reasonable period afterwards. Administrator records are kept while the person has access and for a period afterwards for security purposes.",
      "## 6. Your rights",
      "Under Ghana’s Data Protection Act, 2012 (Act 843), you may ask to see the personal data we hold about you, to correct it, to object to certain uses, or to have it deleted where the law allows. Contact us and we will respond within a reasonable time. You may also complain to Ghana’s Data Protection Commission.",
      "## 7. Security",
      "We use reasonable technical and organisational measures to protect data, including encrypted connections, restricted administrator access and multi-factor authentication for administrators. No system is completely secure.",
      "## 8. Children",
      "The site is a general news service and is not aimed at children. We do not knowingly collect personal data from children.",
      "## 9. Links to other sites",
      "Our stories link to third-party sites with their own privacy practices. We are not responsible for them.",
      "## 10. Changes",
      "We may update this policy. The “last updated” date shows the current version.",
      "## 11. Contact",
      `Email: ${EMAIL}`,
    ],
  },
  terms: {
    title: "Terms of use",
    paragraphs: [
      `Last updated: ${UPDATED}`,
      "## 1. About this site",
      `${SITE_NAME} (${SITE_URL}) is an automated news digest covering artificial intelligence and technology, with a focus on global news and on Ghana and Africa. It is operated by ${OPERATOR}, Ghana (“we”, “us”). By using the site you agree to these terms. If you do not agree, please do not use it.`,
      "## 2. What we publish",
      "We collect headlines and links from published sources, use an AI system to draft short summaries, and review stories before they appear. Every story links to the original reporting. Our summaries are not a substitute for the original articles. See our Methodology page for how stories are selected, summarised and reviewed.",
      "## 3. AI-generated content and accuracy",
      "Summaries are generated with the help of AI and may contain errors or omissions, even after human review. We do not guarantee that any content is accurate, complete or up to date. Please read the original source before relying on a story. If you find a mistake, tell us through the Corrections page and we will review it.",
      "## 4. No professional advice",
      "Content on this site is for general information only. It is not financial, investment, legal, medical or other professional advice.",
      "## 5. Third-party content and links",
      "Stories link to websites we do not own or control. The original articles, images, names and trademarks belong to their owners. We do not endorse the sources we link to and are not responsible for their content, availability or privacy practices. A link to a source does not mean the source endorses us.",
      "## 6. Our content",
      `Unless otherwise stated, the site’s design, code and our original text (such as our summaries and editor notes) belong to ${OPERATOR}. You may read the site, share links to it, and quote short excerpts with credit and a link back. You may not copy the site in bulk, republish our summaries commercially, or present our content as your own without written permission.`,
      "## 7. Requests from publishers",
      `If you publish content we link to or summarise and you want a source removed, a summary changed, or an item taken down, contact us at ${EMAIL}. We will respond promptly and act on reasonable requests.`,
      "## 8. Acceptable use",
      "Do not use the site in a way that damages it or interferes with others, including attempting to gain unauthorised access, probing for vulnerabilities, or sending automated traffic that degrades the service. The administration area is for authorised staff only.",
      "## 9. Availability",
      "This is a small, independently run project. The site may be changed, interrupted or discontinued at any time without notice.",
      "## 10. Limitation of liability",
      "To the fullest extent permitted by law, the site and its content are provided “as is”, without warranties of any kind. We are not liable for any loss or damage arising from your use of the site or your reliance on its content. Nothing in these terms limits any liability that cannot be limited by law.",
      "## 11. Changes to these terms",
      "We may update these terms from time to time. The “last updated” date shows when the current version took effect. Continued use of the site after a change means you accept the new terms.",
      "## 12. Governing law",
      "These terms are governed by the laws of the Republic of Ghana, and the courts of Ghana have jurisdiction over any dispute.",
      "## 13. Contact",
      `Email: ${EMAIL}`,
    ],
  },
};