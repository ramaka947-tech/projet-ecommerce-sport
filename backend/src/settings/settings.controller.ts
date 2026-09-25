import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Put()
  update(@Body() body: Record<string, string>) {
    return this.settingsService.update(body);
  }
}