import { PrismaClient } from "@prisma/client";

export const getPrismaClient = (): PrismaClient => {
	return new PrismaClient();
};
