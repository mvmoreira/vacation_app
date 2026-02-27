import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { TripsModule } from './trips/trips.module';
import { CitiesModule } from './cities/cities.module';
import { CategoriesModule } from './categories/categories.module';
import { SavingsModule } from './savings/savings.module';
import { ExpensesModule } from './expenses/expenses.module';
import { FundingModule } from './funding/funding.module';
import { TransfersModule } from './transfers/transfers.module';
import { JwtAuthGuard } from './common/guards';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TeamsModule,
    TripsModule,
    CitiesModule,
    CategoriesModule,
    SavingsModule,
    ExpensesModule,
    FundingModule,
    TransfersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
