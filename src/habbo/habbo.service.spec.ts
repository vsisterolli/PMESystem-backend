import { Test, TestingModule } from '@nestjs/testing';
import { HabboService } from './habbo.service';

describe('HabboService', () => {
  let service: HabboService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HabboService],
    }).compile();

    service = module.get<HabboService>(HabboService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
