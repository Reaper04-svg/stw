const stack: string[] = []

export function pushDialog(id: string): void {
  const existing = stack.indexOf(id)
  if (existing !== -1) stack.splice(existing, 1)
  stack.push(id)
}

export function popDialog(id: string): void {
  const index = stack.lastIndexOf(id)
  if (index !== -1) stack.splice(index, 1)
}

export function isTopDialog(id: string): boolean {
  return stack.length === 0 || stack[stack.length - 1] === id
}
