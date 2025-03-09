import "server-only";
import { testFormSchema, type TestFormType } from "@/utils/forms/test-form";
import { db } from ".";
import { questions, tests } from "./schema";
import { slugify, sqlNow } from "./utils";
import { getRandomPattern } from "@/utils/patterns";
import type { TestUpdateObject, Test, ImageOrPattern } from "@/types/test";
import { eq } from "drizzle-orm";
import { emptyQuestionValues } from "./question";
import { getUserFromDb } from "./user";
import { TEACHER_MAX_TESTS } from "@/utils/constants";
import { isAdmin, isStudent, isTeacher } from "@/utils/user/authorization";

export function getTestById(id: string): Promise<Test | undefined> {
  return db.query.tests
    .findFirst({
      where: eq(tests.id, id),
      with: {
        questions: true,
      },
    })
    .execute();
}

export function userCanModifyTest(
  userId: string,
  testId: string
): Promise<boolean> {
  return Promise.all([
    db.query.tests
      .findFirst({
        columns: {
          authorId: true,
        },
        where: eq(tests.id, testId),
      })
      .execute(),
    getUserFromDb(userId),
  ]).then(([test, user]) => {
    if (!test || !user || isStudent(user)) return false;

    return test.authorId === user.id || isAdmin(user);
  });
}

export function userCanCreateTest(userId: string) {
  return Promise.all([
    db.query.tests
      .findMany({
        where: eq(tests.authorId, userId),
      })
      .execute(),
    getUserFromDb(userId),
  ]).then(([userTests, user]) => {
    if (userTests.length >= TEACHER_MAX_TESTS || !user) return false;

    return isTeacher(user) || isAdmin(user);
  });
}

export async function createEmptyTest(userId: string): Promise<Test> {
  return await db.transaction(async (tx) => {
    const test = await tx
      .insert(tests)
      .values(emptyTestValues(userId))
      .returning()
      .then((r) => r[0]);

    if (!test) {
      return tx.rollback();
    }

    const createdQuestion = await tx
      .insert(questions)
      .values(emptyQuestionValues(test.id))
      .returning();

    return { ...test, questions: createdQuestion };
  });
}

export function emptyTestValues(userId: string) {
  const testName = "Untitled Test";
  return {
    authorId: userId,
    name: testName,
    slug: slugify(`${testName}-${userId}`, { maxChars: 255 }),
    description: "",
    imageOrPattern: {
      type: "pattern",
      value: getRandomPattern(),
    } as ImageOrPattern,
    minimumCorrectAnswers: 0,
    questionsCount: 0,
    attempts: 1,
    autoScore: false,
    isDraft: false,
  };
}

export function createTest(
  values: TestFormType,
  userId: string
): Promise<Test> {
  const validatedValues = testFormSchema.parse(values);

  return db.transaction(async (tx) => {
    const testSlug = slugify(validatedValues.name, { maxChars: 255 });

    const testResult = await tx
      .insert(tests)
      .values({
        authorId: userId,
        name: validatedValues.name,
        slug: testSlug,
        description: validatedValues.description,
        //   TODO: implement image upload
        imageOrPattern: {
          type: "pattern",
          value: getRandomPattern(),
        },
        minimumCorrectAnswers: validatedValues.minimumCorrectAnswers,
        questionsCount: validatedValues.questionsCount,
        attempts: validatedValues.attempts,
        autoScore: validatedValues.autoScore,
        timeInMinutes: validatedValues.timeInMinutes,
      })
      .returning();
    const createdTest = testResult[0];

    if (!createdTest) {
      return tx.rollback();
    }

    const questionsResult = await tx
      .insert(questions)
      .values(
        validatedValues.questions.map((q) => ({
          testId: createdTest.id,
          name: q.name,
          description: q.description,
          questionType: q.questionType,
          answers: q.answers,
          //   TODO: implement image upload
          image: undefined,
        }))
      )
      .returning();

    return {
      ...createdTest,
      questions: questionsResult,
    };
  });
}

export async function updateTest(testId: string, values: TestUpdateObject) {
  const currentTestValues = await db
    .select({
      name: tests.name,
      slug: tests.slug,
    })
    .from(tests)
    .leftJoin(questions, eq(tests.id, questions.testId))
    .where(eq(tests.id, testId))
    .limit(1)
    .then((r) => r[0]);

  if (!currentTestValues) throw new Error("Test now found");

  return db
    .update(tests)
    .set({
      name: values.name,
      slug:
        currentTestValues.name === values.name
          ? currentTestValues.slug
          : slugify(values.name, { maxChars: 255 }),
      description: values.description,
      minimumCorrectAnswers: values.minimumCorrectAnswers,
      questionsCount: values.questionsCount,
      attempts: values.attempts,
      autoScore: values.autoScore,
      timeInMinutes: values.timeInMinutes,
    })
    .where(eq(tests.id, testId))
    .returning()
    .then((r) => r[0]!);
}

export const deleteTest = async (id: string): Promise<boolean> => {
  try {
    await db
      .update(tests)
      .set({
        deletedAt: sqlNow(),
      })
      .where(eq(tests.id, id));
  } catch (err) {
    console.error(err);
    return false;
  }

  return true;
};

export const restoreTest = async (id: string): Promise<boolean> => {
  try {
    await db
      .update(tests)
      .set({
        deletedAt: null,
      })
      .where(eq(tests.id, id));
  } catch (err) {
    console.error(err);
    return false;
  }

  return true;
};
