import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransferDto {
    @IsString()
    @IsNotEmpty()
    fromCategoryId!: string;

    @IsString()
    @IsNotEmpty()
    toCategoryId!: string;

    @IsNumber()
    @Min(0.01)
    @Type(() => Number)
    amount!: number;

    @IsDateString()
    date!: string;

    @IsString()
    @IsOptional()
    description?: string;
}
