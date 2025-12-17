import { relations } from "drizzle-orm/relations";
import { supplement, interaction, user, session, stack, stackItem, log, account } from "./schema";

export const interactionRelations = relations(interaction, ({one}) => ({
	supplement_sourceId: one(supplement, {
		fields: [interaction.sourceId],
		references: [supplement.id],
		relationName: "interaction_sourceId_supplement_id"
	}),
	supplement_targetId: one(supplement, {
		fields: [interaction.targetId],
		references: [supplement.id],
		relationName: "interaction_targetId_supplement_id"
	}),
}));

export const supplementRelations = relations(supplement, ({many}) => ({
	interactions_sourceId: many(interaction, {
		relationName: "interaction_sourceId_supplement_id"
	}),
	interactions_targetId: many(interaction, {
		relationName: "interaction_targetId_supplement_id"
	}),
	stackItems: many(stackItem),
	logs: many(log),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	logs: many(log),
	accounts: many(account),
	stacks: many(stack),
}));

export const stackItemRelations = relations(stackItem, ({one}) => ({
	stack: one(stack, {
		fields: [stackItem.stackId],
		references: [stack.id]
	}),
	supplement: one(supplement, {
		fields: [stackItem.supplementId],
		references: [supplement.id]
	}),
}));

export const stackRelations = relations(stack, ({one, many}) => ({
	stackItems: many(stackItem),
	user: one(user, {
		fields: [stack.userId],
		references: [user.id]
	}),
}));

export const logRelations = relations(log, ({one}) => ({
	user: one(user, {
		fields: [log.userId],
		references: [user.id]
	}),
	supplement: one(supplement, {
		fields: [log.supplementId],
		references: [supplement.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));