import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Post()
    create(@Body() body: { name: string; email: string; subject?: string; content: string }) {
        return this.messagesService.create(body);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll() {
        return this.messagesService.findAll();
    }

    @Patch(':id/read')
    @UseGuards(JwtAuthGuard)
    markAsRead(@Param('id') id: string) {
        return this.messagesService.markAsRead(id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string) {
        return this.messagesService.remove(id);
    }

    @Patch(':id/reply')
    @UseGuards(JwtAuthGuard)
    reply(@Param('id') id: string, @Body('reply') reply: string) {
        return this.messagesService.reply(id, reply);
    }

}