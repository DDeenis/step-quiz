import {
  QuestionComplexity,
  QuestionCreateObject,
  QuestionType,
  QuestionUpdateObject,
} from "@/types/question";
import type { Quiz, QuizCreateObject, QuizUpdateObject } from "@/types/quiz";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormGetValues,
  type FieldErrors,
} from "react-hook-form";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useRef } from "react";
import IconButton from "@mui/material/IconButton";
import { getTotalScore } from "@/utils/questions";
import FormHelperText from "@mui/material/FormHelperText";

type RemoveQuestionFn =
  | ((question: QuestionCreateObject) => void)
  | ((question: QuestionUpdateObject) => void);

interface QuizFormProps {
  quiz?: Quiz;
  onSubmit:
    | ((formData: QuizCreateObject) => void)
    | ((formData: QuizUpdateObject) => void);
  onRemoveQuestion?: RemoveQuestionFn;
}

export function QuizForm(props: QuizFormProps) {
  const {
    control,
    register,
    unregister,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<QuizCreateObject>({
    defaultValues: props.quiz,
  });
  const questionsErrorType = errors.questions?.root?.type;
  const isUpdate = Boolean(props.quiz);

  const questionFieldsArray = useFieldArray<QuizCreateObject>({
    control: control,
    name: "questions",
    rules: {
      validate: {
        questionsMinimum: (value, formValues) => {
          const minimumQuestions = formValues.questionsCount;
          return !(minimumQuestions > value.length);
        },
        scoreMinimum: (value, formValues) => {
          const totalScore = getTotalScore(value);
          return totalScore >= formValues.minimumScore;
        },
        variantsMinimum: (value) => {
          return value.every((q) => q.questionData.variants.length >= 2);
        },
        answersMinimum: (value) => {
          return value.every((q) => q.answerData.length > 0);
        },
      },
    },
    shouldUnregister: true,
  });

  const appendQuestion = () =>
    questionFieldsArray.append({
      questionType: QuestionType.SingleVariant,
      complexity: QuestionComplexity.Low,
      questionData: { question: "", variants: [] },
      answerData: [],
    });
  const removeQuestion = (i: number) => () => {
    const question = getValues().questions[i];
    questionFieldsArray.remove(i);
    // @ts-expect-error
    props.onRemoveQuestion?.(question);
  };

  const onSubmit = handleSubmit(props.onSubmit);

  useEffect(() => {
    if (props.quiz?.questions) {
      setValue("questions", props.quiz.questions);
    }
  }, []);

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      gap={4}
      component={"form"}
      onSubmit={onSubmit}
      noValidate
    >
      <Box
        display={"flex"}
        flexWrap={"wrap"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Typography variant="h2">
          {isUpdate ? "Update" : "Create new"} quiz
        </Typography>
        <Button type="submit" variant="contained" size="large">
          {isUpdate ? "Update" : "Create"}
        </Button>
      </Box>
      {questionsErrorType && (
        <FormHelperText error>
          {questionsErrorType === "scoreMinimum"
            ? "Overral score is less than minimal score"
            : questionsErrorType === "variantsMinimum"
            ? "All questions must have at least 2 variants"
            : questionsErrorType === "answersMinimum"
            ? "All questions must have at least 1 answer"
            : "Questions count and minimum questions count don't match"}
        </FormHelperText>
      )}
      <Box
        display={"flex"}
        gap={4}
        justifyContent={"space-between"}
        flexWrap={"wrap"}
      >
        <Box sx={{ flexBasis: { md: "48%", xs: "100%" } }}>
          <TextField
            variant="filled"
            label="Quiz name"
            sx={{ mb: 2 }}
            required
            fullWidth
            error={Boolean(errors.name)}
            {...register("name", { required: true })}
          />
          <TextField
            placeholder="Description"
            multiline
            rows={6}
            fullWidth
            {...register(`description`)}
          />
        </Box>
        <Box sx={{ flexBasis: { md: "48%", xs: "100%" } }}>
          <TextField
            type="number"
            variant="outlined"
            label="Time in minutes"
            required
            fullWidth
            error={Boolean(errors.time)}
            {...register("time", {
              required: true,
              min: 1,
              valueAsNumber: true,
            })}
          />
          <TextField
            type="number"
            variant="outlined"
            label="Questions count"
            required
            sx={{ my: 2 }}
            fullWidth
            error={Boolean(errors.questionsCount)}
            {...register("questionsCount", {
              required: true,
              min: 1,
              valueAsNumber: true,
            })}
          />
          <TextField
            type="number"
            variant="outlined"
            label="Minimum score"
            required
            fullWidth
            error={Boolean(errors.minimumScore)}
            {...register("minimumScore", {
              required: true,
              min: 1,
              valueAsNumber: true,
            })}
          />
          <TextField
            type="number"
            variant="outlined"
            label="Attempts"
            fullWidth
            sx={{ mt: 2 }}
            error={Boolean(errors.attempts)}
            {...register("attempts", {
              min: 1,
              valueAsNumber: true,
            })}
          />
        </Box>
      </Box>
      <Box display={"flex"} flexDirection={"column"} gap={4}>
        {questionFieldsArray.fields.map((field, index) => (
          <FormField
            index={index}
            control={control}
            errors={errors}
            onRemove={removeQuestion(index)}
            register={register}
            getValues={getValues}
            setValue={setValue}
            key={field.id}
          />
        ))}
        <Button variant="outlined" onClick={appendQuestion}>
          Add question
        </Button>
      </Box>
    </Box>
  );
}

type UseArrayHackType = {
  variants: {
    value: string;
  }[];
};

const FormField = ({
  index,
  control,
  errors,
  onRemove,
  register,
  getValues,
  setValue,
}: {
  index: number;
  control: Control<QuizCreateObject, any>;
  errors: FieldErrors<QuizCreateObject>;
  onRemove: () => void;
  register: UseFormRegister<QuizCreateObject>;
  getValues: UseFormGetValues<QuizCreateObject>;
  setValue: UseFormSetValue<QuizCreateObject>;
}) => {
  const variantsForm = useForm<UseArrayHackType>({
    defaultValues: {
      variants: [{ value: "" }, { value: "" }],
    },
  });
  const variantsFieldsArray = useFieldArray<UseArrayHackType>({
    control: variantsForm.control,
    name: "variants",
  });
  const questionType = useWatch({
    control,
    name: `questions.${index}.questionType`,
  });
  const selectedIndexes = useRef(new Set<number>());

  const appendVariant = () => variantsFieldsArray.append([{ value: "" }]);
  const getVariant = (i: number) =>
    getValues().questions[index]?.questionData.variants[i] ?? "";

  const removeVariant = (i: number) => () => {
    const question = getValues().questions[index];
    const variants = question?.questionData.variants ?? [];
    const variant = variants[i] ?? "";
    const answerData = question?.answerData ?? [];

    if (variants.length <= 2) return;

    setValue(
      `questions.${index}.answerData`,
      answerData.filter((v) => v !== variant)
    );
    setValue(
      `questions.${index}.questionData.variants`,
      variants.filter((v) => v !== variant)
    );
    variantsFieldsArray.remove(i);
  };

  const defaultVariansSet = useRef(false);

  useEffect(() => {
    if (defaultVariansSet.current) return;

    const existingVariants =
      getValues().questions[index]?.questionData.variants;

    if (!existingVariants) {
      defaultVariansSet.current = true;
      return;
    }

    for (let i = 0; i < existingVariants.length - 2; i++) {
      appendVariant();
    }
    defaultVariansSet.current = true;
  }, []);

  return (
    <Card sx={{ p: 2 }}>
      <Box
        display="flex"
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Typography gutterBottom variant="h5" component="div">
          Question {index + 1}
        </Typography>
        <IconButton aria-label="delete" size="medium" onClick={onRemove}>
          <DeleteIcon fontSize="medium" />
        </IconButton>
      </Box>
      <CardContent sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <Box flexGrow={1} display={"flex"} flexDirection={"column"} gap={2}>
          <TextField
            type={"text"}
            variant="filled"
            label={"Question"}
            fullWidth
            error={Boolean(errors.questions?.[index]?.questionData?.question)}
            required
            {...register(`questions.${index}.questionData.question`, {
              required: true,
            })}
          />
          <TextField
            placeholder="Description"
            multiline
            rows={4}
            fullWidth
            {...register(`questions.${index}.questionData.description`)}
          />
          <FormControl fullWidth>
            <InputLabel id={`complexity-label-${index}`}>Complexity</InputLabel>
            <Controller
              control={control}
              name={`questions.${index}.complexity`}
              render={({ field: { value } }) => {
                return (
                  <Select
                    labelId={`complexity-label-${index}`}
                    label="Complexity"
                    required
                    fullWidth
                    value={value}
                    inputProps={register(`questions.${index}.complexity`, {
                      required: true,
                    })}
                  >
                    <MenuItem value={QuestionComplexity.Low}>Low</MenuItem>
                    <MenuItem value={QuestionComplexity.Medium}>
                      Medium
                    </MenuItem>
                    <MenuItem value={QuestionComplexity.High}>High</MenuItem>
                  </Select>
                );
              }}
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id={`qtype-label-${index}`}>
              Question answer type
            </InputLabel>
            <Controller
              control={control}
              name={`questions.${index}.questionType`}
              render={({ field: { value } }) => {
                return (
                  <Select
                    labelId={`qtype-label-${index}`}
                    label="Question answer type"
                    value={value}
                    required
                    fullWidth
                    inputProps={register(`questions.${index}.questionType`, {
                      required: true,
                      onChange() {
                        setValue(`questions.${index}.answerData`, []);
                      },
                    })}
                  >
                    <MenuItem value={QuestionType.SingleVariant}>
                      Single variant
                    </MenuItem>
                    <MenuItem value={QuestionType.MultipleVariants}>
                      Multiple variants
                    </MenuItem>
                  </Select>
                );
              }}
            />
          </FormControl>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box flexGrow={2} display={"flex"} flexDirection={"column"} gap={2}>
          {variantsFieldsArray.fields.map((field, i) => (
            <Box display={"flex"} gap={2} key={field.id}>
              <TextField
                variant="outlined"
                label={`Variant ${i + 1}`}
                required
                fullWidth
                error={Boolean(
                  errors.questions?.[index]?.questionData?.variants?.[i]
                )}
                {...register(`questions.${index}.questionData.variants.${i}`, {
                  required: true,
                  shouldUnregister: true,
                  onChange() {
                    setValue(
                      `questions.${index}.answerData`,
                      [...selectedIndexes.current].map((i) => getVariant(i))
                    );
                  },
                })}
              />
              <Controller
                control={control}
                name={`questions.${index}.answerData`}
                render={({ field: { onBlur, value, ref } }) => {
                  const variant = getVariant(i);
                  const val = value.includes(variant);

                  val && selectedIndexes.current.add(i);

                  return questionType === QuestionType.SingleVariant ? (
                    <Radio
                      onBlur={onBlur}
                      onChange={(e, checked) => {
                        const variant = getVariant(i);
                        setValue(
                          `questions.${index}.answerData`,
                          checked
                            ? [variant]
                            : value.filter((v) => v !== variant)
                        );
                        checked
                          ? (selectedIndexes.current = new Set([i]))
                          : selectedIndexes.current.delete(i);
                      }}
                      checked={val}
                      inputRef={ref}
                      name="radio-buttons"
                    />
                  ) : (
                    <Checkbox
                      onBlur={onBlur}
                      onChange={(e, checked) => {
                        const variant = getVariant(i);
                        setValue(
                          `questions.${index}.answerData`,
                          checked
                            ? [...value, variant]
                            : value.filter((v) => v !== variant)
                        );
                        checked
                          ? selectedIndexes.current.add(i)
                          : selectedIndexes.current.delete(i);
                      }}
                      checked={val}
                      inputRef={ref}
                    />
                  );
                }}
              />
              <IconButton
                aria-label="delete"
                size="small"
                onClick={removeVariant(i)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button onClick={appendVariant} variant="contained">
            Add variant
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
