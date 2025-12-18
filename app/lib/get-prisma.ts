export async function getPrisma() {
  const { default: prisma } = await import("./prisma");
  return prisma;
}
