import { testFormSchema } from "@/utils/forms/test-form";
import { createTRPCRouter, protectedProcedure, teacherProcedure } from "./trpc";
import {
  createEmptyTest,
  getTestById,
  updateTest,
  userCanCreateTest,
  userCanModifyTest,
} from "../db/test";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createEmptyQuestion, userCanCreateTestQuestion } from "../db/question";

const testsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.string())
    .query(({ input }) => getTestById(input)),
  createEmptyTest: teacherProcedure.mutation(async ({ ctx }) => {
    if (!(await userCanCreateTest(ctx.session.user.id))) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return createEmptyTest(ctx.session.user.id);
  }),
  createEmptyQuestion: teacherProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      if (!(await userCanCreateTestQuestion(input, ctx.session.user.id))) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return createEmptyQuestion(input);
    }),
  updateTest: teacherProcedure
    .input(z.object({ testId: z.string(), values: testFormSchema }))
    .mutation(async ({ input, ctx }) => {
      const updateAllowed = await userCanModifyTest(
        input.testId,
        ctx.session.user.id
      );

      if (!updateAllowed) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return updateTest(input.testId, input.values);
    }),
});

export default testsRouter;
