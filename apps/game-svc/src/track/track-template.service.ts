import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
    TrackTemplate,
    TrackType,
    CreateTrackDto
} from "@backend-evolved/shared";

@Injectable()
export class TrackTemplateService {
    constructor(
        @InjectRepository(TrackTemplate) private trackTemplateRepository: Repository<TrackTemplate>,
    ) { }

    async create(data: CreateTrackDto) {
        const track = this.trackTemplateRepository.create(data)
        return this.trackTemplateRepository.save(track)
    }

    async findAll() {
        return this.trackTemplateRepository.find()
    }

    async findOne(id: string) {
        const track = await this.trackTemplateRepository.findOne({ where: { id } })
        if (!track) throw new NotFoundException("Track not found")
        return track
    }

    async update(id: string, data: Partial<TrackTemplate>) {
        const track = await this.findOne(id)
        Object.assign(track, data)
        return this.trackTemplateRepository.save(track)
    }

    async remove(id: string) {
        const track = await this.findOne(id)
        await this.trackTemplateRepository.remove(track)
        return { deleted: true }
    }
}
