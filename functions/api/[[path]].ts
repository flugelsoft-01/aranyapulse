import worker from "../../worker/src/index";

interface PagesContext {
  request: Request;
  env: {
    ASSETS: { fetch: (request: Request) => Promise<Response> };
  };
}

export async function onRequest(context: PagesContext): Promise<Response> {
  return worker.fetch(context.request, context.env);
}
