/* eslint-env browser */
import {compose} from './plugin/index.js';
import timing from './timing';

export default function() {
  return class ClientApp {
    constructor(element, render) {
      function ssr(ctx, next) {
        ctx.prefix = window.__ROUTE_PREFIX__ || ''; // serialized by ./server
        ctx.element = element;
        ctx.preloadChunks = [];
        return next();
      }
      function renderer(ctx, next) {
        ctx.rendered = render(ctx.element);
        return next();
      }
      this.plugins = [timing, ssr, renderer];
    }
    onerror(e) {
      // TODO: Should we call window.onerror instead?
      throw e;
    }
    plugin(plugin, dependencies) {
      const service = plugin(dependencies);
      this.plugins.splice(-1, 0, service);
      return service;
    }
    callback() {
      const middleware = compose(this.plugins);
      return () => {
        const ctx = {
          url: window.location.path + window.location.search,
          element: null,
          body: null,
        };
        return middleware(ctx, () => Promise.resolve());
      };
    }
    simulate(ctx) {
      return compose(this.plugins)(ctx).then(() => ctx);
    }
  };
}
