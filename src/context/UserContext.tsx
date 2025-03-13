import React, { createContext, useContext, useState, FC } from "react";
import { IUser } from "../Interfaces";


interface UserContextType {
  user: IUser | undefined;
  setUser: (user: IUser | undefined) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: FC<React.PropsWithChildren<object>> = ({ children }) => {
  const [user, setUser] = useState<IUser | undefined>(undefined);

  return <UserContext.Provider value={{ user: user, setUser: setUser }}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
