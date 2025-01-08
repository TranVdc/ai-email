import axios from "axios";
import { EmailMessage, SyncResponse, SyncUpdatedResponse } from "./types";
import { resolve } from "path";

export class Account {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async startSync() {
    const respone = await axios.post<SyncResponse>(
      `https://api.aurinko.io/v1/email/sync`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params: {
          daysWithin: 2,
          bodyType: "html",
        },
      },
    );

    return respone.data;
  }

  async getUpdatedEmails({
    deltaToken,
    pageToken,
  }: {
    deltaToken?: string;
    pageToken?: string;
  }) {
    let params: Record<string, string> = {};
    if (deltaToken) params.deltaToken = deltaToken;
    if (pageToken) params.pageToken = pageToken;

    const respone = await axios.get<SyncUpdatedResponse>(
      `https://api.aurinko.io/v1/email/sync/updated`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params,
      },
    );

    return respone.data;
  }

  async performInitialSync() {
    try {
      // start to sync process
      let syncRespone = await this.startSync();
      while (!syncRespone.ready) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        syncRespone = await this.startSync();
      }

      // get the bookmark data token
      let storedDeltaToken: string = syncRespone.syncUpdatedToken;
      let updatedRespone = await this.getUpdatedEmails({
        deltaToken: storedDeltaToken,
      });

      if (updatedRespone.nextDeltaToken) {
        // sync has completed
        storedDeltaToken = updatedRespone.nextDeltaToken;
      }

      let allEmails: EmailMessage[] = updatedRespone.records;

      // fetch all pages if there are more
      while (updatedRespone.nextPageToken) {
        updatedRespone = await this.getUpdatedEmails({
          pageToken: updatedRespone.nextPageToken,
        });
        allEmails = allEmails.concat(updatedRespone.records);

        if (updatedRespone.nextDeltaToken) {
          // sync has ended
          storedDeltaToken = updatedRespone.nextDeltaToken;
        }
      }
      console.log(
        `initial sync completed, we have synced`,
        allEmails.length,
        `emails`,
      );

      //store the latest delta token for future incremental syncs
      return {
        emails: allEmails,
        deltaToken: storedDeltaToken,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Error during sync:`, error);
      } else {
        console.error(`Error during sync:`, error);
      }
    }
  }
}
