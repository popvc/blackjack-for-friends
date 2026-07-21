import type { $ZodIssue } from "zod/v4/core";

type errorResData = { message: string; errors: { detail: string; pointer: string | undefined }[] };

//type successResData<T> = { message: string, data: T}

// Might use '#/pointer.../' pattern instead of 'pointer.../', I just need to double check conventions

//Using 'body.pointer.../' and 'params.pointer.../' for now until I have a justifiable reason to change it

export function zodErrorBodyBody(message: string, issues: $ZodIssue[]): errorResData {
  return {
    message,
    errors: issues.map((issue) => {
      return { detail: issue.message, pointer: `body.${issue.path[0]?.toString()}` };
    }),
  };
}

export function zodErrorParamsBody(message: string, issues: $ZodIssue[]): errorResData {
  return {
    message,
    errors: issues.map((issue) => {
      return { detail: issue.message, pointer: `params.${issue.path[0]?.toString()}` };
    }),
  };
}

export function errorBodyBody(
  message: string,
  issue: { detail: string; pointer: string },
): errorResData {
  return { message, errors: [{ detail: issue.detail, pointer: `body.${issue.pointer}` }] };
}

export function errorParamsBody(
  message: string,
  issue: { detail: string; pointer: string },
): errorResData {
  //return { message, errors: [issue] };
  return { message, errors: [{ detail: issue.detail, pointer: `params.${issue.pointer}` }] };
}

/*
export function successBody<T>(message: string, data: T): successResData<T> {
  return { message, data };
}
*/
