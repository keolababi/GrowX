import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

const authorSelect = {
  id: true,
  email: true,
  profile: { select: { displayName: true, avatarUrl: true } },
} as const;

function serializeAuthor(author: {
  id: string;
  email: string;
  profile: { displayName: string | null; avatarUrl: string | null } | null;
}) {
  return {
    id: author.id,
    email: author.email,
    displayName: author.profile?.displayName ?? null,
    avatarUrl: author.profile?.avatarUrl ?? null,
  };
}

type QuestionInput = {
  type: string;
  label: string;
  options?: string[];
  required: boolean;
};

export async function listMyForms(userId: string) {
  const forms = await prisma.feedbackForm.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true, responses: true } } },
  });
  return {
    forms: forms.map((form) => ({
      id: form.id,
      title: form.title,
      description: form.description,
      createdAt: form.createdAt,
      questionCount: form._count.questions,
      responseCount: form._count.responses,
    })),
  };
}

export async function createForm(
  userId: string,
  input: { title: string; description?: string; questions: QuestionInput[] },
) {
  const form = await prisma.feedbackForm.create({
    data: {
      authorId: userId,
      title: input.title,
      description: input.description,
      questions: {
        create: input.questions.map((question, index) => ({
          type: question.type as never,
          label: question.label,
          options: question.options ?? undefined,
          required: question.required,
          order: index,
        })),
      },
    },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  return { form };
}

export async function getForm(userId: string, formId: string) {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: formId },
    include: {
      author: { select: authorSelect },
      questions: { orderBy: { order: 'asc' } },
      _count: { select: { responses: true } },
    },
  });
  if (!form) throw new HttpError(404, 'Асуулга олдсонгүй.');

  const myResponse = await prisma.feedbackResponse.findUnique({
    where: { formId_respondentId: { formId, respondentId: userId } },
    select: { id: true },
  });

  return {
    id: form.id,
    title: form.title,
    description: form.description,
    createdAt: form.createdAt,
    author: serializeAuthor(form.author),
    isOwner: form.authorId === userId,
    responseCount: form._count.responses,
    respondedByMe: Boolean(myResponse),
    questions: form.questions.map((question) => ({
      id: question.id,
      type: question.type,
      label: question.label,
      options: question.options,
      required: question.required,
      order: question.order,
    })),
  };
}

export async function deleteForm(userId: string, formId: string) {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: formId },
    select: { authorId: true },
  });
  if (!form) throw new HttpError(404, 'Асуулга олдсонгүй.');
  if (form.authorId !== userId) throw new HttpError(403, 'Устгах эрхгүй байна.');
  await prisma.feedbackForm.delete({ where: { id: formId } });
}

type AnswerInput = { questionId: string; textValue?: string; optionsValue?: string[] };

export async function submitResponse(userId: string, formId: string, answers: AnswerInput[]) {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: formId },
    select: { id: true, questions: { select: { id: true, required: true } } },
  });
  if (!form) throw new HttpError(404, 'Асуулга олдсонгүй.');

  const existing = await prisma.feedbackResponse.findUnique({
    where: { formId_respondentId: { formId, respondentId: userId } },
    select: { id: true },
  });
  if (existing) throw new HttpError(409, 'Та энэ асуулгад аль хэдийн хариулсан байна.');

  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  for (const question of form.questions) {
    if (!question.required) continue;
    const answer = answerByQuestion.get(question.id);
    const hasText = !!answer?.textValue?.trim();
    const hasOptions = !!answer?.optionsValue?.length;
    if (!hasText && !hasOptions) {
      throw new HttpError(400, 'Заавал бөглөх асуултуудыг бөглөнө үү.');
    }
  }

  const response = await prisma.feedbackResponse.create({
    data: {
      formId,
      respondentId: userId,
      answers: {
        create: answers
          .filter((answer) => answer.textValue?.trim() || answer.optionsValue?.length)
          .map((answer) => ({
            questionId: answer.questionId,
            textValue: answer.textValue,
            optionsValue: answer.optionsValue ?? undefined,
          })),
      },
    },
  });
  return { responseId: response.id };
}

export async function listResponses(userId: string, formId: string) {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: formId },
    select: { authorId: true, questions: { orderBy: { order: 'asc' } } },
  });
  if (!form) throw new HttpError(404, 'Асуулга олдсонгүй.');
  if (form.authorId !== userId) throw new HttpError(403, 'Хариултыг харах эрхгүй байна.');

  const responses = await prisma.feedbackResponse.findMany({
    where: { formId },
    orderBy: { createdAt: 'desc' },
    include: {
      respondent: { select: authorSelect },
      answers: true,
    },
  });

  return {
    questions: form.questions.map((question) => ({
      id: question.id,
      type: question.type,
      label: question.label,
      options: question.options,
    })),
    responses: responses.map((response) => ({
      id: response.id,
      createdAt: response.createdAt,
      respondent: serializeAuthor(response.respondent),
      answers: response.answers.map((answer) => ({
        questionId: answer.questionId,
        textValue: answer.textValue,
        optionsValue: answer.optionsValue,
      })),
    })),
  };
}
