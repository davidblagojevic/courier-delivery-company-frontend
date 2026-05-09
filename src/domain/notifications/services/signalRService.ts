import * as signalR from '@microsoft/signalr';
import { log } from 'shared/log';

export interface NotificationData {
  id: string;
  type: string;
  orderId?: string;
  status?: string;
  message: string;
  createdAt: string;
  notificationStatus?: string;
}

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private onConnectionStateChanged?: (isConnected: boolean) => void;

  constructor(
    private hubUrl: string,
    private getAccessToken: () => string | null,
  ) {}

  public async start(): Promise<void> {
    // Exit if already connected or starting
    if (this.connection) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => {
          const token = this.getAccessToken();
          if (!token) {
            // The connection will fail if the factory returns null/undefined.
            // No need to throw an explicit error here.
            return '';
          }
          // The factory should return just the token string
          return token.replace(/^Bearer\s+/, '');
        },
      })
      .withAutomaticReconnect({
        // Use an exponential backoff strategy for retries
        nextRetryDelayInMilliseconds: (retryContext) => {
          const delay = Math.pow(2, retryContext.previousRetryCount) * 1000;
          return Math.min(delay, 60000); // Max delay of 60 seconds
        },
      })
      .build();

    // Notify listeners when connection is lost
    this.connection.onreconnecting((error) => {
      log.warn('SignalR: Connection lost, attempting to reconnect...', error);
      this.onConnectionStateChanged?.(false);
    });

    // Notify listeners and rejoin group upon successful reconnection
    this.connection.onreconnected(async () => {
      log.info('SignalR: Connection re-established.');
      this.onConnectionStateChanged?.(true);
      await this.joinUserGroup();
    });

    // Notify listeners when the connection is closed for good
    this.connection.onclose((error) => {
      if (error) {
        log.error('SignalR: Connection closed due to an error.', error);
      } else {
        log.info('SignalR: Connection closed normally.');
      }
      this.onConnectionStateChanged?.(false);
    });

    try {
      await this.connection.start();
      this.onConnectionStateChanged?.(true);
      await this.joinUserGroup();
    } catch (error) {
      log.error('SignalR: Failed to start connection.', error);
      // Clean up on failure
      this.connection = null;
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.connection) return;

    try {
      await this.connection.stop();
    } catch (error) {
      log.error('SignalR: Error stopping connection.', error);
    } finally {
      this.connection = null;
    }
  }

  private async joinUserGroup(): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) return;
    try {
      await this.connection.invoke('JoinUserGroup');
      log.info('SignalR: Joined user group.');
    } catch (error) {
      log.error('SignalR: Failed to join user group.', error);
    }
  }

  public onNotificationReceived(callback: (notification: NotificationData) => void): () => void {
    this.connection?.on('ReceiveNotification', callback);
    // Return a function to easily unsubscribe
    return () => this.connection?.off('ReceiveNotification', callback);
  }

  public get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  public setConnectionStateChangeCallback(callback: (isConnected: boolean) => void): void {
    this.onConnectionStateChanged = callback;
  }
}