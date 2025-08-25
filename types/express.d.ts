import * as express from 'express';

declare global {
  namespace Express {
    interface User {
      id?: string;
      username?: string;
      email?: string;
      // agrega otras propiedades que uses en req.user
    }

    interface Request {
      user?: User;
    }
  }
}
