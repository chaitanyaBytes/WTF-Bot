import pino, { transport } from "pino"

export const logger = pino({
    level: process.env.LOG_LEVEL,
    transport: {
        target: "pino-pretty",
        options: { Colorize: true },
    },
});