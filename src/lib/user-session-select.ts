export const userSessionSelect = {
  id: true,
  email: true,
  name: true,
  role: {
    select: {
      id: true,
      slug: true,
      name: true,
      tier: true,
      permissions: {
        select: {
          permission: { select: { key: true } },
        },
      },
    },
  },
} as const;
