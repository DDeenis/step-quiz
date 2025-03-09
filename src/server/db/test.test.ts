import { describe, expect, it } from "vitest";
import {
  createEmptyTest,
  createTest,
  deleteTest,
  emptyTestValues,
  getTestById,
  restoreTest,
  updateTest,
  userCanCreateTest,
  userCanModifyTest,
} from "./test";
import fixtures from "@/utils/test/fixtures";
import type { TestFormType } from "@/utils/forms/test-form";
import { type TestUpdateObject } from "@/types/test";
import { db } from ".";
import { tests } from "./schema";
import { eq } from "drizzle-orm";
import { UserRole } from "@/types/user";

describe("Tests DAL", { retry: 2 }, () => {
  it("getTestById should return test", async () => {
    const userId = (await fixtures.createUser()).id;
    const test = await fixtures.createTest(userId);

    await expect(getTestById(test.id)).resolves.toStrictEqual(test);
  });

  it("userCanModifyTest should return true if user has permissions to modify a test", async () => {
    const [teacher, admin] = await Promise.all([
      fixtures.createUser({
        email: "teacher1@example.com",
        role: UserRole.Teacher,
      }),
      fixtures.createUser({
        email: "admin@example.com",
        role: UserRole.Admin,
      }),
    ]);
    const test = await fixtures.createTest(teacher.id);

    await expect(userCanModifyTest(teacher.id, test.id)).resolves.toBe(true);
    await expect(userCanModifyTest(admin.id, test.id)).resolves.toBe(true);
  });

  it("userCanModifyTest should return false if user does not have permissions to modify a test", async () => {
    const [teacher1, teacher2, student] = await Promise.all([
      fixtures.createUser({
        email: "teacher1@example.com",
        role: UserRole.Teacher,
      }),
      fixtures.createUser({
        email: "teacher2@example.com",
        role: UserRole.Teacher,
      }),
      fixtures.createUser({
        email: "student@example.com",
        role: UserRole.Student,
      }),
    ]);
    const test = await fixtures.createTest(teacher1.id);

    await expect(userCanModifyTest(teacher2.id, test.id)).resolves.toBe(false);
    await expect(userCanModifyTest(student.id, test.id)).resolves.toBe(false);
  });

  it("userCanCreateTest should return true if user has permissions to create a test", async () => {
    const [teacher, admin] = await Promise.all([
      fixtures.createUser({
        email: "teacher1@example.com",
        role: UserRole.Teacher,
      }),
      fixtures.createUser({
        email: "admin@example.com",
        role: UserRole.Admin,
      }),
    ]);

    await expect(userCanCreateTest(teacher.id)).resolves.toBe(true);
    await expect(userCanCreateTest(admin.id)).resolves.toBe(true);
  });

  it("userCanCreateTest should return false if user does not have permissions to create a test", async () => {
    const student = await fixtures.createUser({
      email: "student@example.com",
      role: UserRole.Student,
    });

    await expect(userCanCreateTest(student.id)).resolves.toBe(false);
  });

  it("createEmptyTest should create and empty test", async () => {
    const userId = (await fixtures.createTeacher()).id;
    const emptyValues = emptyTestValues(userId);
    const test = await createEmptyTest(userId);

    expect(test.authorId).toBe(emptyValues.authorId);
    expect(test.name).toBe(emptyValues.name);
    expect(test.description).toBe(emptyValues.description);
    expect(test.autoScore).toBe(emptyValues.autoScore);
    expect(test.imageOrPattern.type).toBe(emptyValues.imageOrPattern.type);
    expect(test.minimumCorrectAnswers).toBe(emptyValues.minimumCorrectAnswers);
    expect(test.questionsCount).toBe(emptyValues.questionsCount);
    expect(test.isDraft).toBe(emptyValues.isDraft);
    expect(test.slug).toMatch(new RegExp(`untitled-test-${userId}-\\d{4}`));
  });

  it("createTest should create test", async () => {
    const userId = (await fixtures.createUser()).id;
    const formValues = fixtures.testFormValues();
    const test = await createTest(formValues, userId);

    for (const prop in formValues) {
      if (prop === "image" || prop === "questions") continue;
      const propTyped = prop as Exclude<keyof TestFormType, "image">;
      expect(test[propTyped]).toBe(formValues[propTyped]);
    }

    expect(test.slug).toMatch(/^javascript-test-\d{4}$/);

    // compare only properties that were present in form values
    expect(
      test.questions.map((q) =>
        q.description
          ? {
              name: q.name,
              description: q.description,
              questionType: q.questionType,
              answers: q.answers,
            }
          : {
              name: q.name,
              questionType: q.questionType,
              answers: q.answers,
            }
      )
    ).toStrictEqual(formValues.questions);
  });

  it("createTest should create two tests with the same name but different slugs", async () => {
    const userId = (await fixtures.createUser()).id;
    const formValues = fixtures.testFormValues();

    const test1 = await createTest(formValues, userId);
    const test2 = await createTest(formValues, userId);

    expect(test1.name).toBe(test2.name);
    expect(test1.slug).not.toBe(test2.slug);
  });

  it("updateTest should update test", async () => {
    const userId = (await fixtures.createUser()).id;
    const test = await fixtures.createTest(userId);

    const values = {
      name: "Updated Name",
      description: "Updated Description",
      autoScore: true,
      minimumCorrectAnswers: 1,
      questionsCount: 2,
      questions: test.questions,
      attempts: 1,
      timeInMinutes: 35,
    };
    const updatedTest = await updateTest(test.id, values);

    for (const prop in values) {
      if (prop === "image" || prop === "questions") continue;
      const propTyped = prop as Exclude<
        keyof TestUpdateObject,
        "image" | "questions"
      >;
      expect(updatedTest[propTyped]).toBe(values[propTyped]);
    }

    expect(updatedTest.slug).toMatch(/updated-name-\d{4}/);
  });

  it("deleteTest should soft delete test", async () => {
    const userId = (await fixtures.createUser()).id;
    const test = await fixtures.createTest(userId);

    const result = await deleteTest(test.id);

    expect(result).toBe(true);
    await expect(
      db
        .select()
        .from(tests)
        .where(eq(tests.id, test.id))
        .limit(1)
        .then((r) => r[0]!.deletedAt)
    ).resolves.not.toBeNull();
  });

  it("restoreTest should restore soft deleted test", async () => {
    const userId = (await fixtures.createUser()).id;
    const test = await fixtures.createTest(userId);

    await deleteTest(test.id);
    const result = await restoreTest(test.id);

    expect(result).toBe(true);
    await expect(
      db
        .select()
        .from(tests)
        .where(eq(tests.id, test.id))
        .limit(1)
        .then((r) => r[0]!.deletedAt)
    ).resolves.toBeNull();
  });
});
