import { Response } from "express";

type ChangeEvent = {
  type: "change";
  collection: string;
  action: "create" | "update" | "delete";
  id: string;
  at: string;
};

const clients = new Set<Response>();

export function addClient(res: Response) {
  clients.add(res);
}

export function removeClient(res: Response) {
  clients.delete(res);
}

export function publishChange(collection: string, action: ChangeEvent["action"], id: string) {
  const event: ChangeEvent = { type: "change", collection, action, id, at: new Date().toISOString() };
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}
