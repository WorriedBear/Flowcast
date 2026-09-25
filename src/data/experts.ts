export const EXPERTS = [
  { id: 'elena', name: 'Elena Vogt, CTP', firm: 'Harbor & Vale Advisory', focus: 'FX and treasury', langs: 'English, German', rating: 4.9, sla: 'Replies within 4 business hours' },
  { id: 'rahul', name: 'Rahul Menon, CPA', firm: 'Harbor & Vale Advisory', focus: 'Intercompany and tax', langs: 'English, Hindi, Malayalam', rating: 4.8, sla: 'Replies within 1 business day' },
  { id: 'sofia', name: 'Sofia Park', firm: 'Northgate FP&A Partners', focus: 'FP&A and cash planning', langs: 'English, Korean', rating: 4.7, sla: 'Replies within 1 business day' },
];
export const expertById = (id: string) => EXPERTS.find((e) => e.id === id);
