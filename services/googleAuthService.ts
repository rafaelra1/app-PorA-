/**
 * Service to manage Google OAuth using Google Identity Services (GIS)
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;

export const googleAuthService = {
    /**
     * Initialize GAPI and GIS
     */
    async init() {
        if (gapiInited && gisInited) return;

        return new Promise<void>((resolve) => {
            const checkInit = () => {
                if (gapiInited && gisInited) resolve();
            };

            // Load GAPI
            (window as any).gapi.load('client', async () => {
                await (window as any).gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: DISCOVERY_DOCS,
                });
                gapiInited = true;
                checkInit();
            });

            // Load GIS
            tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: '', // defined at request time
            });
            gisInited = true;
            checkInit();
        });
    },

    /**
     * Request a fresh access token
     */
    async getAccessToken(): Promise<string> {
        await this.init();

        return new Promise((resolve, reject) => {
            try {
                tokenClient.callback = async (resp: any) => {
                    if (resp.error !== undefined) {
                        reject(resp);
                    }
                    resolve(resp.access_token);
                };

                if ((window as any).gapi.client.getToken() === null) {
                    // Prompt the user to select an Google Account and ask for consent to share their data
                    // when establishing a new session.
                    tokenClient.requestAccessToken({ prompt: 'consent' });
                } else {
                    // Skip display of account chooser and consent dialog for an existing session.
                    tokenClient.requestAccessToken({ prompt: '' });
                }
            } catch (err) {
                console.error("Error requesting access token:", err);
                reject(err);
            }
        });
    },

    /**
     * Check if user is already authorized
     */
    isAuthorized(): boolean {
        return (window as any).gapi?.client?.getToken() !== null;
    }
};
