export class AsyncSha256 {
  async_digest(
    msg: string,
    callback: (hash: string) => void,
    progress: (remaining: number) => void,
  ): void;
}
