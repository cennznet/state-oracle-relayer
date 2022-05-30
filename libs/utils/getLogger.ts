import { createLogger, format, transports, Logger } from "winston";
import chalk from "chalk";

type LoggerService = "RequestListener" | "RequestProccessor" | string;
const instances = {} as Record<LoggerService, Logger>;

export const getLogger = (service: LoggerService): Logger => {
	if (instances[service]) return instances[service];

	return (instances[service] = createLogger({
		level: "info",
		transports: [
			new transports.File({
				filename: `logs/app.log`,
				maxsize: 2048000, // 2 MB
				maxFiles: 10,
				format: format.combine(
					format.uncolorize(),
					format.label({
						label: service,
						message: true,
					}),
					getDefaultFormat()
				),
			}),

			new transports.Console({
				format: format.combine(
					format.colorize(),
					format.label({
						label: chalk.cyan(service),
						message: true,
					}),
					getDefaultFormat(),
					format.printf(({ level, message, timestamp }) => {
						return `${chalk.blue(timestamp)} ${level}: ${message}`;
					})
				),
			}),
		],
	}));
};

function getDefaultFormat() {
	return format.combine(
		format.timestamp({
			format: "YYYY-MM-DD HH:mm:ss",
		}),
		format.errors({ stack: true }),
		format.splat(),
		format.json()
	);
}
