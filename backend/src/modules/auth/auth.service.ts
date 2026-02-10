import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { ENV } from "../../config/env";
import { prisma } from "../../utils/db";

type PublicUser = {
	id: string;
	email: string;
	role: Role;
	createdAt: Date;
};

export const registerUser = async (
	email: string,
	password: string,
	role: Role
): Promise<PublicUser> => {
	const existingUser = await prisma.user.findUnique({
		where: { email }
	});

	if (existingUser) {
		throw new Error("User already exists");
	}

	const passwordHash = await bcrypt.hash(password, 10);

	const user = await prisma.user.create({
		data: {
			email,
			passwordHash,
			role
		},
		select: {
			id: true,
			email: true,
			role: true,
			createdAt: true
		}
	});

	return user;
};

export const loginUser = async (email: string, password: string): Promise<string> => {
	const user = await prisma.user.findUnique({
		where: { email }
	});

	if (!user) {
		throw new Error("Invalid credentials");
	}

	const isValidPassword = await bcrypt.compare(password, user.passwordHash);

	if (!isValidPassword) {
		throw new Error("Invalid credentials");
	}

	const token = jwt.sign(
		{
			userId: user.id,
			role: user.role
		},
		ENV.JWT_SECRET,
        { expiresIn: "1d" }
	);

	return token;
};
