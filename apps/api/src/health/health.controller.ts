import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/roles';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok' };
  }
}
