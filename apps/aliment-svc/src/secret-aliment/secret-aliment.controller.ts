import { Controller } from '@nestjs/common';
import { SecretAlimentService } from './secret-aliment.service';

@Controller('secret-aliment')
export class SecretAlimentController {
    constructor(private readonly secretAlimentService: SecretAlimentService) { }
}
