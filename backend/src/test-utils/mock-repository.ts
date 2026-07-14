import { ObjectLiteral, Repository } from 'typeorm';

export type MockRepo<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

export const createMockRepo = <T extends ObjectLiteral>(): MockRepo<T> => ({
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});
