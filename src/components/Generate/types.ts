export type ContentItem = {
  id: string;
  title: string;
  date: string;
  contentType: string;
  subject?: string;
  subjectTitle?: string;
  content?: string;
  copyContent?: boolean;
  shared?: boolean;
};
