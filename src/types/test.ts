import type { TestFormType } from "@/utils/forms/test-form";
import type { Question, QuestionClient } from "./question";
import { type TestSession } from "./testSession";

export interface Test {
  id: string;
  authorId: string;
  name: string;
  slug: string;
  description: string | null;
  imageOrPattern: ImageOrPattern;
  autoScore: boolean;
  timeInMinutes: number | null;
  questionsCount: number;
  minimumCorrectAnswers: number;
  attempts: number | null;
  createdAt: Date | null;
  deletedAt: Date | null;
  isDraft: boolean;
  questions: Question[];
}

export type TestPreview = Pick<
  Test,
  "id" | "name" | "slug" | "imageOrPattern" | "timeInMinutes" | "questionsCount"
> & {
  sessions: TestSession[];
};

export type TestClient = Omit<Test, "questions"> & {
  questions: QuestionClient[];
};

export type TestCreateObject = TestFormType;

export type TestUpdateObject = Omit<TestCreateObject, "questions">;

export interface TestOption {
  id: string;
  name: string;
}

export interface ImageOrPattern {
  type: "image" | "pattern";
  value: string;
}

export enum TestStatus {
  None = "none",
  Started = "started",
  Passed = "passed",
  Failed = "failed",
}
