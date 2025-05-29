export interface IPost {
  _id: string;
  title: string;
  content: string;
  senderId: string;
  imgUrl?: string;
  senderName?: string;
  senderProfile?: string;
  commentsCount?: number;
  usersIdLikes: string[];
}

export interface IComments {
  _id: string;
  isEditing: boolean;
  postId: string;
  content: string;
  senderId: string;
  imgUrl: string;
  senderName?: string;
  senderProfile?: string;
}

export interface IUser {
  _id: string;
  email: string;
  username: string;
  password: string;
  fullName: string;
  refreshToken?: string[];
  imgUrl?: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export interface LastPostElementRefProps {
  node: Element | null;
}

export const INTINAL_DATA_USER: IUser = {
  _id: "",
  email: "",
  username: "",
  password: "",
  fullName: "",
  refreshToken: [],
  imgUrl: "",
};

export const INTINAL_DATA_POST: IPost = {
  _id: "",
  title: "",
  content: "",
  senderId: "",
  usersIdLikes: [],
};

export const INTINAL_DATA_COMMENT: IComments = {
  _id: "",
  postId: "",
  content: "",
  isEditing: false,
  senderId: "",
  imgUrl: "",
};
export type INotification = {
  _id: string;
  subjectId: string;
  day: string;
  time: {
    hour: number;
    minute: number;
  };
  userId: string;
};

export type ISubject = {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  resultsId: string[];
};
