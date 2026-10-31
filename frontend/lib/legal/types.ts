export type LegalSection = { title: string; content: string };

export type LegalDocument = {
  title: string;
  description: string;
  sections: LegalSection[];
};