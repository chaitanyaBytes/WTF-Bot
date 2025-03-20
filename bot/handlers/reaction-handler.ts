import { WAMessageUpdate, WASocket } from "baileys";
import { logger } from "../logger";

export async function handleReaction(update: WAMessageUpdate, sock: WASocket) {
    const { key } = update;
    const { reactions, message } = update.update
    const messageId = key.id;

    const reactionCount = reactions?.length;

    if (reactionCount === 0) return;

    reactions?.forEach(async (reaction) => {
        const emoji = reaction.text;
        logger.info(`Received reaction: ${emoji} on message ID: ${messageId}`);

        // Optional: Send a reply to acknowledge reaction
        await sock.sendMessage(key.remoteJid!, {
            text: `Reaction received: ${emoji}`,
        });
    })

    logger.info(`${reactionCount} reactions recieved.`);
}
