import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  getQuizResultWithQuiz,
  getQuizResults,
  getQuizResultsByQuiz,
  getQuizResultsByUser,
} from "@/server/db/quizResult";
import { getUserQuizSessions } from "@/server/db/quizSession";
import { isQuizSessionExpired } from "@/utils/questions";

export const quizResultRouter = createTRPCRouter({
  getWithQuiz: protectedProcedure
    .input(z.object({ quizResultId: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await getQuizResultWithQuiz(input.quizResultId);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      if (result?.userId !== ctx.session.user.id && !ctx.session.user.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      return result;
    }),

  getAllForQuiz: adminProcedure
    .input(z.object({ quizId: z.string() }))
    .query(async ({ input }) => {
      return await getQuizResultsByQuiz(input.quizId);
    }),

  getAllForQuizByUser: protectedProcedure
    .input(z.object({ quizId: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await getQuizResults(input.quizId, ctx.session.user.id);

      if (
        result?.some((tr) => tr.userId !== ctx.session.user.id) &&
        !ctx.session.user.isAdmin
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      return result;
    }),

  getAllByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (ctx.session.user.id !== input.userId && !ctx.session.user.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const result = await getQuizResultsByUser(input.userId);
      return result;
    }),

  getActiveQuizSessions: protectedProcedure.query(async ({ ctx }) => {
    const allSessions = await getUserQuizSessions(ctx.session.user.id);

    if (!allSessions) return [];

    return allSessions.filter((s) => !isQuizSessionExpired(s));
  }),
});
