import { EventEmitter } from 'events';
import pino, { Logger } from 'pino'
import NodeCache from 'node-cache'

import qrcode from "qrcode-terminal";
import QRCode, { QRCodeToStringOptions } from "qrcode";

import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    getAggregateVotesInPollMessage,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    useMultiFileAuthState,
    Browsers,
    proto,
    WAMessageContent,
    WAMessageKey,
    WAMessageUpdate
} from 'baileys'
import { readFileSync, existsSync, rmSync } from 'fs';

import dotenv from "dotenv";
dotenv.config();

import { logger } from './logger';
import { handleReaction } from './handlers/reaction-handler';

async function startBot() {
    logger.info("Starting whatsapp bot...");

    const { state, saveCreds } = await useMultiFileAuthState(process.env.BOT_AUTH_FOLDER || "auth-info");

    const QRCodeOptions: QRCodeToStringOptions = {
        type: "terminal",
        small: true,
    }

    const sock = makeWASocket({
        auth: state,
        logger,
    })

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect, legacy, isOnline } = update;

        if (qr) {
            logger.info("Scan the QR code to authenticate.");
            QRCode.toString(qr, QRCodeOptions, (err, url) => {
                if (err) {
                    console.log("[QRCODE ERROR]: ", err);
                } else {
                    console.log("QR string: ", url);
                }
            })
        }

        if (connection === "open") {
            logger.info("✅ Bot connected to WhatsApp.");
            console.log(legacy?.user);
        }

        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.cause === DisconnectReason.loggedOut

            if (shouldReconnect) {
                logger.error("❌ Connection closed. Restarting...");
                startBot(); // Auto-reconnect on failure
            }
        }

        // Listen for reactions
        sock.ev.on("messages.update", async (updates: WAMessageUpdate[]) => {
            for (const update of updates) {
                if (!update.update.reactions) continue;
                await handleReaction(update, sock);
            }
        });

        return sock;
    })
}

startBot();