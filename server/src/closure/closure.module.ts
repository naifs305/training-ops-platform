import { Module } from '@nestjs/common';
import { ClosureController } from './closure.controller';
import { ClosureService } from './closure.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ClosureController],
  providers: [ClosureService],
})
export class ClosureModule {}