import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    tripId!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsEnum(['GLOBAL', 'PER_PERSON'])
    @IsOptional()
    budgetType?: 'GLOBAL' | 'PER_PERSON';

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    budgetGoal?: number;

    @IsOptional()
    budgetDetails?: Record<string, number>;
}

export class UpdateCategoryDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(['GLOBAL', 'PER_PERSON'])
    @IsOptional()
    budgetType?: 'GLOBAL' | 'PER_PERSON';

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    budgetGoal?: number;

    @IsOptional()
    budgetDetails?: Record<string, number>;
}
