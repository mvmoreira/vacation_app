import { IsString, IsNotEmpty, IsDateString, IsInt, IsOptional, IsEnum, Min } from 'class-validator';

export class CreateTripDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsDateString()
    startDate!: string;

    @IsDateString()
    endDate!: string;

    @IsString()
    @IsNotEmpty()
    currency!: string;
}

export class UpdateTripDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsEnum(['PLANNING', 'ACTIVE', 'COMPLETED'])
    @IsOptional()
    status?: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
}
