// Mock PrismaClient for testing
export const mockPrisma = {
  school: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  inventory: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  issue: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

export function resetAllMocks() {
  mockPrisma.$transaction.mockReset()
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object') {
      Object.values(model).forEach((fn) => {
        ;(fn as jest.Mock).mockReset()
      })
    }
  })
}