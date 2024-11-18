export type JobStartMessage = {
  file: File;
};

export type JobDoneMessage = {
  hash: string;
};

export type ProgressMessage = {
  total: number;
  remaining: number;
};
