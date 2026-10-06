export interface User {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token?: string;
  isGuest?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  displayName?: string;
}
