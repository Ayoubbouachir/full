import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: '../front-end/public/assets/images/projects',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `project-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      return { error: 'No files uploaded' };
    }
    const fileData = files.map((file) => ({
      filename: file.filename,
      path: `/assets/images/projects/${file.filename}`,
    }));
    return {
      message: 'Files uploaded successfully',
      files: fileData,
    };
  }

  @Get('FindAll')
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('Find/:id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch('Update/:id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Patch(':id/artisan-response')
  updateArtisanResponse(
    @Param('id') id: string,
    @Body('artisanId') artisanId: string,
    @Body('response') response: 'accepted' | 'refused',
  ) {
    return this.projectsService.updateArtisanResponse(id, artisanId, response);
  }

  @Delete('Delete/:id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/tasks')
  addTask(@Param('id') id: string, @Body() taskData: any) {
    return this.projectsService.addTask(id, taskData);
  }

  @Post(':id/tasks/:taskId/assign')
  assignArtisan(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body('artisanId') artisanId: string,
  ) {
    return this.projectsService.assignArtisanToTask(id, taskId, artisanId);
  }

  @Patch(':id/tasks/:taskId/status')
  updateTaskStatus(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body('artisanId') artisanId: string,
    @Body('status') status: string,
  ) {
    return this.projectsService.updateTaskStatus(id, taskId, artisanId, status);
  }

  @Post(':id/tasks/:taskId/select-products')
  selectProducts(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body('productIds') productIds: string[],
  ) {
    return this.projectsService.selectTaskProducts(id, taskId, productIds);
  }

  @Get('artisans/occupancy/:artisanId')
  getArtisanOccupancy(@Param('artisanId') artisanId: string) {
    return this.projectsService.countActiveProjectsForArtisan(artisanId);
  }

  @Get('artisan/:artisanId')
  findForArtisan(@Param('artisanId') artisanId: string) {
    return this.projectsService.findForArtisan(artisanId);
  }

  @Patch(':id/tasks/:taskId/negotiate')
  negotiatePrice(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body('artisanId') artisanId: string,
    @Body('price') price: number,
  ) {
    return this.projectsService.proposeTaskPrice(id, taskId, artisanId, price);
  }

  @Patch(':id/tasks/:taskId/finalize')
  finalizePrice(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body('price') price: number,
  ) {
    return this.projectsService.finalizeTaskPrice(id, taskId, price);
  }

  @Patch(':id/tasks/:taskId/counter')
  counterPrice(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body('price') price: number,
  ) {
    return this.projectsService.counterTaskPrice(id, taskId, price);
  }

  @Post(':id/tasks/:taskId/progress')
  addProgress(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body('artisanId') artisanId: string,
    @Body()
    progressDto: { description: string; percentage: number; images: string[] },
  ) {
    return this.projectsService.addTaskProgress(
      id,
      taskId,
      artisanId,
      progressDto,
    );
  }
}
