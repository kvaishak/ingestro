/** Every number the user reads goes through here, so all counts look the same ("12,345"). */
export function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}
