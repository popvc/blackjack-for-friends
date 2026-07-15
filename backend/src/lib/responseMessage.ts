import type { $ZodIssue } from "zod/v4/core";

type errorResData = { message: string; errors: {detail: string, pointer: unknown}[] };

//type successResData<T> = { message: string, data: T}

// Might use '#/pointer.../' pattern instead of 'pointer.../', I just need to double check conventions
// This might help explicitly distinguish it from 'params.pointer'

export function zodErrorBody(message: string, issues: $ZodIssue[]): errorResData {
  return {
    message,
    errors: issues.map((issue) => {
      return { detail: issue.message, pointer: issue.path[0]};
    }),
  };
}

/*
export function errorBody(message: string,detail: string, pointer: string): errorResData {
  return { message, errors: [{ detail, pointer }] };
}
  */


export function errorBody(
  message: string,
  issue: { detail: string; pointer: string },
): errorResData {
  return { message, errors: [issue] };
}


/*
export function successBody<T>(message: string, data: T): successResData<T> {
  return { message, data };
}
  */