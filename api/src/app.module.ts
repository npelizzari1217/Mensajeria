import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './presentation/auth/auth.module';
import { MessagingModule } from './presentation/messaging/messaging.module';
import { AttachmentsModule } from './presentation/attachments/attachments.module';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';
import { AppExceptionFilter } from './presentation/shared/filters/exception.filter';
import { ResponseInterceptor } from './presentation/shared/interceptors/response.interceptor';

@Module({
  imports: [AuthModule, MessagingModule, AttachmentsModule, EventBusModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
