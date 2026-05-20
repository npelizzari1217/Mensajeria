import {
  Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus,
  UseGuards, Req,
} from '@nestjs/common';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { SaveDraftUseCase } from '../../application/drafts/use-cases/save-draft.use-case';
import { UpdateDraftUseCase } from '../../application/drafts/use-cases/update-draft.use-case';
import { GetDraftUseCase } from '../../application/drafts/use-cases/get-draft.use-case';
import { ListDraftsUseCase } from '../../application/drafts/use-cases/list-drafts.use-case';
import { SendDraftUseCase } from '../../application/drafts/use-cases/send-draft.use-case';
import { DeleteDraftUseCase } from '../../application/drafts/use-cases/delete-draft.use-case';
import { SaveDraftDTO, UpdateDraftDTO } from '../../application/drafts/dtos/draft.dto';

@Controller('drafts')
@UseGuards(AuthGuard)
export class DraftsController {
  constructor(
    private readonly saveDraft: SaveDraftUseCase,
    private readonly updateDraft: UpdateDraftUseCase,
    private readonly getDraft: GetDraftUseCase,
    private readonly listDrafts: ListDraftsUseCase,
    private readonly sendDraft: SendDraftUseCase,
    private readonly deleteDraft: DeleteDraftUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async save(@Body() dto: SaveDraftDTO, @Req() req: any) {
    dto.userId = req.user.userId;
    const empresaId = req.user.empresaId ?? '00000000-0000-0000-0000-000000000001';
    const result = await this.saveDraft.execute(dto, empresaId);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Get()
  async list(@Req() req: any) {
    const empresaId = req.user.empresaId ?? '00000000-0000-0000-0000-000000000001';
    const result = await this.listDrafts.execute(req.user.userId, empresaId);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: any) {
    const empresaId = req.user.empresaId ?? '00000000-0000-0000-0000-000000000001';
    const result = await this.getDraft.execute(id, req.user.userId, empresaId);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDraftDTO, @Req() req: any) {
    const empresaId = req.user.empresaId ?? '00000000-0000-0000-0000-000000000001';
    const result = await this.updateDraft.execute(id, req.user.userId, dto, empresaId);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.CREATED)
  async send(@Param('id') id: string, @Req() req: any) {
    const empresaId = req.user.empresaId ?? '00000000-0000-0000-0000-000000000001';
    const result = await this.sendDraft.execute(id, req.user.userId, empresaId);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: any) {
    const empresaId = req.user.empresaId ?? '00000000-0000-0000-0000-000000000001';
    const result = await this.deleteDraft.execute(id, req.user.userId, empresaId);
    if (result.isErr()) throw result.unwrapErr();
  }
}
