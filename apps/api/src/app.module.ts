import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { APP_ENV, loadEnv } from './config/env';
import { EquiposController } from './equipos/equipos.controller';
import { HealthController } from './health/health.controller';
import { SupabaseService } from './supabase/supabase.service';

@Module({
  controllers: [HealthController, EquiposController],
  providers: [
    { provide: APP_ENV, useFactory: loadEnv },
    SupabaseService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
