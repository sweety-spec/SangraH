import type { NextApiRequest, NextApiResponse } from "next";
import serverless from "serverless-http";
import { createApp } from "../../server/app";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

let handlerPromise: Promise<ReturnType<typeof serverless>> | null = null;

async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = createApp().then((app) =>
      serverless(app, {
        binary: ["image/*", "application/octet-stream"]
      })
    );
  }
  return handlerPromise;
}

export default async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  const handler = await getHandler();
  await handler(req, res);
}
