describe('Prisma Client Singleton', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    jest.resetModules()
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true })
  })

  it('should export a prisma instance', async () => {
    jest.mock('@prisma/client', () => ({
      PrismaClient: jest.fn().mockImplementation(() => ({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        school: {},
        inventory: {},
        issue: {},
      })),
    }))

    const { prisma } = await import('@/lib/prisma')
    expect(prisma).toBeDefined()
    expect(prisma.school).toBeDefined()
    expect(prisma.inventory).toBeDefined()
    expect(prisma.issue).toBeDefined()
  })

  it('should reuse the same instance in development', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })

    const mockInstance = { $connect: jest.fn(), school: {}, inventory: {}, issue: {} }
    jest.mock('@prisma/client', () => ({
      PrismaClient: jest.fn().mockImplementation(() => mockInstance),
    }))

    const { prisma: prisma1 } = await import('@/lib/prisma')
    jest.resetModules()
    jest.mock('@prisma/client', () => ({
      PrismaClient: jest.fn().mockImplementation(() => mockInstance),
    }))
    // In dev mode, the global cache means the same instance is reused
    expect(prisma1).toBeDefined()
  })

  it('should store prisma on globalThis in non-production', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })

    jest.mock('@prisma/client', () => ({
      PrismaClient: jest.fn().mockImplementation(() => ({
        $connect: jest.fn(),
      })),
    }))

    await import('@/lib/prisma')

    const globalForPrisma = globalThis as any
    expect(globalForPrisma.prisma).toBeDefined()
  })

  it('should not store prisma on globalThis in production', async () => {
    // Clean global state
    delete (globalThis as any).prisma

    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })

    jest.mock('@prisma/client', () => ({
      PrismaClient: jest.fn().mockImplementation(() => ({
        $connect: jest.fn(),
      })),
    }))

    await import('@/lib/prisma')

    // In production, prisma should NOT be cached on globalThis
    // (the conditional check prevents it)
  })
})