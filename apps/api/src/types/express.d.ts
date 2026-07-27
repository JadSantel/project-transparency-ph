// Augments Express's Request type so `req.user` (set by the `authenticate`
// middleware) is typed everywhere without every controller needing its own
// cast. Global augmentation, not a wrapper type, since Express's own
// Router/Request generics don't compose well with a narrowed local type.
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}
