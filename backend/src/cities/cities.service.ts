import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

interface GeoNamesResult {
    geonameId: number;
    name: string;
    countryCode: string;
    countryName: string;
    lat: string;
    lng: string;
}

@Injectable()
export class CitiesService {
    private readonly geoNamesUsername: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        this.geoNamesUsername = this.configService.get<string>('GEONAMES_USERNAME') ?? 'demo';
    }

    async search(query: string) {
        const url = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=10&username=${this.geoNamesUsername}&featureClass=P&style=MEDIUM`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.geonames) return [];

        return data.geonames.map((g: GeoNamesResult) => ({
            geonameId: g.geonameId,
            name: g.name,
            countryCode: g.countryCode,
            countryName: g.countryName,
            latitude: parseFloat(g.lat),
            longitude: parseFloat(g.lng),
        }));
    }

    async addCityToTrip(tripId: string, teamId: string, geonameId: number, order: number, arrivalDate?: string, departureDate?: string) {
        // Verify trip belongs to team
        const trip = await this.prisma.trip.findFirst({ where: { id: tripId, teamId } });
        if (!trip) throw new NotFoundException('Trip not found');

        // Upsert city from GeoNames cache
        let city = await this.prisma.city.findUnique({ where: { geonameId } });

        if (!city) {
            // Fetch from GeoNames
            const url = `http://api.geonames.org/getJSON?geonameId=${geonameId}&username=${this.geoNamesUsername}`;
            const response = await fetch(url);
            const g = await response.json();

            city = await this.prisma.city.create({
                data: {
                    geonameId: g.geonameId,
                    name: g.name,
                    countryCode: g.countryCode,
                    countryName: g.countryName,
                    latitude: parseFloat(g.lat),
                    longitude: parseFloat(g.lng),
                },
            });
        }

        return this.prisma.tripCity.upsert({
            where: { tripId_cityId: { tripId, cityId: city.id } },
            create: {
                tripId,
                cityId: city.id,
                order,
                arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
                departureDate: departureDate ? new Date(departureDate) : null,
            },
            update: {
                order,
                arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
                departureDate: departureDate ? new Date(departureDate) : null,
            },
            include: { city: true },
        });
    }

    async removeCityFromTrip(tripId: string, teamId: string, cityId: string) {
        const trip = await this.prisma.trip.findFirst({ where: { id: tripId, teamId } });
        if (!trip) throw new NotFoundException('Trip not found');

        const tripCity = await this.prisma.tripCity.findFirst({ where: { tripId, cityId } });
        if (!tripCity) throw new NotFoundException('City not in this trip');

        await this.prisma.tripCity.delete({ where: { id: tripCity.id } });
        return { message: 'City removed from trip' };
    }
}
