import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFundingEntryDto {
    @IsString()
    @IsNotEmpty()
    categoryId!: string;

    @IsNumber()
    @Min(0.01)
    @Type(() => Number)
    amount!: number;

    @IsDateString()
    date!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(['CASH', 'CREDIT_CARD'])
    method!: 'CASH' | 'CREDIT_CARD';
}
