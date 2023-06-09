import type { QuizCreateObject } from "@/types/quiz";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import { QuizForm } from "@/components/QuizForm";
import { useAdminSession } from "@/hooks/session";
import Head from "next/head";

export default function CreateQuiz() {
  const { mutateAsync } = api.quizes.createQuiz.useMutation();
  const { push } = useRouter();
  useAdminSession();

  const onSubmit = (formValues: QuizCreateObject) => {
    mutateAsync({ quizCreateObject: formValues }).then(
      (createdSuccessfully) => {
        createdSuccessfully && push("/quiz");
      }
    );
  };

  return (
    <>
      <Head>
        <title>Create new quiz</title>
      </Head>
      <QuizForm onSubmit={onSubmit} />
    </>
  );
}
