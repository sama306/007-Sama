declare namespace App {
  interface Locals {
    session: import('@auth/core/types').Session | null;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: 'guest' | 'user' | 'premium' | 'editor' | 'admin';
    } | null;
  }
}
